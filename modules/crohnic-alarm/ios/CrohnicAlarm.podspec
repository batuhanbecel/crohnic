Pod::Spec.new do |s|
  s.name           = 'CrohnicAlarm'
  s.version        = '1.0.0'
  s.summary        = 'Medication alarms for Crohnic (AlarmKit, iOS 26+)'
  s.description    = 'Schedules medication alarms with AlarmKit so they ring in silent mode and Focus.'
  s.author         = 'Crohnic'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # AlarmKit only exists on iOS 26+; weak-link it so older systems still launch
  s.weak_frameworks = 'AlarmKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
