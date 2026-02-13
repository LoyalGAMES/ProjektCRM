import SwiftUI

@main
struct GoalTrackerApp: App {
    @StateObject private var store = GoalStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .preferredColorScheme(.dark)
        }
    }
}
