// Crohnic's native extras, kept in Expo's generated iOS project (CNG: ios/ is never edited by hand):
//  - App Intents + App Shortcuts (Siri, Shortcuts, Spotlight, Action button) in the app target
//  - Control Center / Lock Screen controls and the snoozed-alarm Live Activity in the widget
//    extension that expo-widgets generates (ExpoWidgetsTarget), so no new target, bundle id or
//    provisioning profile is needed and CI keeps building unattended.
//
// Must be listed BEFORE "expo-widgets" in app.json: mods run in reverse order, so this one runs
// after expo-widgets has (re)generated ExpoWidgetsTarget/index.swift and its Xcode target.
const fs = require('fs');
const path = require('path');
const { IOSConfig, withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const SRC = path.join(__dirname, 'ios');
const read = (name) => fs.readFileSync(path.join(SRC, name), 'utf8');
const EXT = 'ExpoWidgetsTarget';
const MARK = '// --- crohnic extras ---';

/** The intents, without the Shortcuts listing, as the widget extension compiles them. */
function extensionIntents() {
  // the app lists the actions in Shortcuts; the extension's copy is only there for the controls
  return read('CrohnicIntents.swift').replace(
    /static let openAppWhenRun: Bool = true/g,
    'static let openAppWhenRun: Bool = true\n  static let isDiscoverable: Bool = false',
  );
}

const withAppIntents = (config) => {
  config = IOSConfig.XcodeProjectFile.withBuildSourceFile(config, { filePath: 'CrohnicIntents.swift', contents: read('CrohnicIntents.swift'), overwrite: true });
  config = IOSConfig.XcodeProjectFile.withBuildSourceFile(config, { filePath: 'CrohnicShortcuts.swift', contents: read('CrohnicShortcuts.swift'), overwrite: true });
  return config;
};

const withWidgetExtras = (config) =>
  withDangerousMod(config, [
    'ios',
    async (c) => {
      const index = path.join(c.modRequest.platformProjectRoot, EXT, 'index.swift');
      if (!fs.existsSync(index)) throw new Error(`crohnic-intents: ${index} not found (list this plugin before expo-widgets)`);
      let src = fs.readFileSync(index, 'utf8');
      if (src.includes(MARK)) return c;
      if (!/WidgetLiveActivity\(\)\n  \}/.test(src)) throw new Error('crohnic-intents: unexpected expo-widgets index.swift layout');
      src = `import AppIntents\nimport ActivityKit\nimport AlarmKit\n${src}`;
      src = src.replace(/WidgetLiveActivity\(\)\n  \}/, 'WidgetLiveActivity()\n    CrohnicExtras().body\n  }');
      // imports go to the top of the file (prepended above); drop the copies' own
      const body = (text) => text.replace(/^import .*\n/gm, '');
      src += `\n\n${MARK}\n${body(extensionIntents())}\n${body(read('CrohnicWidgetExtras.swift'))}`;
      fs.writeFileSync(index, src);
      return c;
    },
  ]);

/** AlarmKit exists only on iOS 26+: weak-link it so the extension still loads on older systems. */
const withWeakAlarmKit = (config) =>
  withXcodeProject(config, (c) => {
    const project = c.modResults;
    const configs = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const settings = configs[key]?.buildSettings;
      if (!settings || !String(settings.PRODUCT_BUNDLE_IDENTIFIER ?? '').includes(EXT)) continue;
      const flags = settings.OTHER_LDFLAGS ? (Array.isArray(settings.OTHER_LDFLAGS) ? settings.OTHER_LDFLAGS : [settings.OTHER_LDFLAGS]) : ['"$(inherited)"'];
      if (!flags.some((f) => String(f).includes('AlarmKit'))) settings.OTHER_LDFLAGS = [...flags, '"-weak_framework"', '"AlarmKit"'];
    }
    return c;
  });

/**
 * Siri matches App Shortcut phrases in the project's development language. The app is Turkish
 * (CFBundleDevelopmentRegion tr) but Expo's template project says en, which would file the
 * Turkish phrases as English ones; make the project Turkish too.
 */
const withTurkishProject = (config) =>
  withXcodeProject(config, (c) => {
    const project = c.modResults.getFirstProject().firstProject;
    project.developmentRegion = 'tr';
    const regions = (project.knownRegions ?? []).map((r) => String(r).replace(/"/g, ''));
    project.knownRegions = ['tr', ...regions.filter((r) => r !== 'tr')];
    return c;
  });

module.exports = function withCrohnicIntents(config) {
  config = withTurkishProject(config);
  config = withAppIntents(config);
  config = withWidgetExtras(config);
  config = withWeakAlarmKit(config);
  return config;
};
