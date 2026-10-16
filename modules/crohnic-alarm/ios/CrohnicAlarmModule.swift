import ExpoModulesCore
import Foundation
import SwiftUI
#if canImport(AlarmKit)
import ActivityKit
import AlarmKit

/// Same name and shape as the type the widget extension renders the snoozed alarm with
/// (plugins/ios/CrohnicWidgetExtras.swift), so the system pairs them.
@available(iOS 26.0, *)
struct CrohnicAlarmMetadata: AlarmMetadata {
  var title: String?
}
#endif

/// Where a Siri / Shortcuts / Control Center action asked the app to go (plugins/ios/CrohnicIntents.swift).
private enum PendingRoute {
  static let group = "group.tr.com.f28.crohnic"
  static let key = "crohnic_pending_route"

  /// The route, once, if it was asked for in the last two minutes.
  static func take() -> String? {
    guard let defaults = UserDefaults(suiteName: group), let route = defaults.string(forKey: key) else { return nil }
    let at = defaults.double(forKey: key + "_at")
    defaults.removeObject(forKey: key)
    defaults.removeObject(forKey: key + "_at")
    return Date().timeIntervalSince1970 - at < 120 ? route : nil
  }
}

/**
 * Medication alarms through AlarmKit (iOS 26+): they ring like the Clock app's alarms,
 * also in silent mode and Focus. "Ertele" snoozes for 10 minutes; while snoozed the widget
 * extension shows the countdown as a Live Activity. Every function is a no-op that reports
 * "unsupported" on older iOS.
 */
public class CrohnicAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CrohnicAlarm")

    /// 2: snooze + routes from App Intents. JS checks it before promising either.
    Function("version") { () -> Int in
      return 2
    }

    Function("takePendingRoute") { () -> String? in
      return PendingRoute.take()
    }

    Function("isSupported") { () -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { return true }
      #endif
      return false
    }

    /// "authorized" | "denied" | "notDetermined" | "unsupported"
    AsyncFunction("authorization") { () -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        switch AlarmManager.shared.authorizationState {
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .notDetermined: return "notDetermined"
        @unknown default: return "notDetermined"
        }
      }
      #endif
      return "unsupported"
    }

    AsyncFunction("requestAuthorization") { () async -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        do {
          return try await AlarmManager.shared.requestAuthorization() == .authorized
        } catch {
          return false
        }
      }
      #endif
      return false
    }

    /// Number of this app's alarms the system still has scheduled.
    AsyncFunction("count") { () -> Int in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        return (try? AlarmManager.shared.alarms.count) ?? 0
      }
      #endif
      return 0
    }

    AsyncFunction("cancelAll") { () -> Void in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let manager = AlarmManager.shared
        for alarm in (try? manager.alarms) ?? [] {
          try? manager.cancel(id: alarm.id)
        }
      }
      #endif
    }

    /// Repeats every day at hour:minute.
    AsyncFunction("scheduleDaily") { (title: String, hour: Int, minute: Int) async throws -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let time = Alarm.Schedule.Relative.Time(hour: hour, minute: minute)
        let every: [Locale.Weekday] = [.monday, .tuesday, .wednesday, .thursday, .friday, .saturday, .sunday]
        let schedule = Alarm.Schedule.relative(Alarm.Schedule.Relative(time: time, repeats: .weekly(every)))
        return try await CrohnicAlarmModule.schedule(title: title, schedule: schedule)
      }
      #endif
      return ""
    }

    /// Rings once at the given time (milliseconds since 1970).
    AsyncFunction("scheduleAt") { (title: String, timestamp: Double) async throws -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let date = Date(timeIntervalSince1970: timestamp / 1000)
        return try await CrohnicAlarmModule.schedule(title: title, schedule: .fixed(date))
      }
      #endif
      return ""
    }
  }

  #if canImport(AlarmKit)
  /// Snooze length: "Ertele" rings again after this many seconds.
  private static let snoozeSeconds: TimeInterval = 600

  @available(iOS 26.0, *)
  private static func schedule(title: String, schedule: Alarm.Schedule) async throws -> String {
    // the system draws its own Stop; the secondary button snoozes (restarts a 10 min countdown)
    let snooze = AlarmButton(
      text: LocalizedStringResource(stringLiteral: "Ertele"),
      textColor: .white,
      systemImageName: "zzz"
    )
    let alert = AlarmPresentation.Alert(
      title: LocalizedStringResource(stringLiteral: title),
      secondaryButton: snooze,
      secondaryButtonBehavior: .countdown
    )
    let countdown = AlarmPresentation.Countdown(
      title: LocalizedStringResource(stringLiteral: "Ertelendi: \(title)"),
      pauseButton: nil
    )
    let attributes = AlarmAttributes<CrohnicAlarmMetadata>(
      presentation: AlarmPresentation(alert: alert, countdown: countdown),
      metadata: CrohnicAlarmMetadata(title: title),
      tintColor: Color(red: 0.08, green: 0.35, blue: 0.20) // Ana Yeşil #145A32
    )
    let configuration = AlarmManager.AlarmConfiguration<CrohnicAlarmMetadata>(
      countdownDuration: Alarm.CountdownDuration(preAlert: nil, postAlert: snoozeSeconds),
      schedule: schedule,
      attributes: attributes,
      sound: .default
    )
    let id = UUID()
    _ = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
    return id.uuidString
  }
  #endif
}
