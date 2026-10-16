import ExpoModulesCore
import Foundation
import SwiftUI
#if canImport(AlarmKit)
import ActivityKit
import AlarmKit

@available(iOS 26.0, *)
struct CrohnicAlarmMetadata: AlarmMetadata {
  init() {}
}
#endif

/**
 * Medication alarms through AlarmKit (iOS 26+): they ring like the Clock app's alarms,
 * also in silent mode and Focus. Alert-only (no countdown/snooze), so no Live Activity
 * widget is needed. Every function is a no-op that reports "unsupported" on older iOS.
 */
public class CrohnicAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CrohnicAlarm")

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
  @available(iOS 26.0, *)
  private static func schedule(title: String, schedule: Alarm.Schedule) async throws -> String {
    let stop = AlarmButton(
      text: LocalizedStringResource(stringLiteral: "Tamam"),
      textColor: .white,
      systemImageName: "checkmark"
    )
    let alert = AlarmPresentation.Alert(title: LocalizedStringResource(stringLiteral: title), stopButton: stop)
    let attributes = AlarmAttributes<CrohnicAlarmMetadata>(
      presentation: AlarmPresentation(alert: alert),
      tintColor: Color(red: 0.08, green: 0.35, blue: 0.20) // Ana Yeşil #145A32
    )
    let configuration = AlarmManager.AlarmConfiguration<CrohnicAlarmMetadata>(
      countdownDuration: nil,
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
