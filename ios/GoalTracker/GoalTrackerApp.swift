import SwiftUI

@main
struct GoalTrackerApp: App {
    @StateObject private var store = GoalStore()

    init() {
        // Load saved API URL
        if let saved = UserDefaults.standard.string(forKey: "apiBaseURL") {
            APIService.shared.baseURL = saved
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
