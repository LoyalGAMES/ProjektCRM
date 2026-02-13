import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "chart.bar.fill") }
                .tag(0)

            GoalsListView()
                .tabItem { Label("Cele", systemImage: "target") }
                .tag(1)

            PlannerView()
                .tabItem { Label("Planer", systemImage: "calendar") }
                .tag(2)

            RisksView()
                .tabItem { Label("Ryzyka", systemImage: "exclamationmark.triangle.fill") }
                .tag(3)

            SettingsView()
                .tabItem { Label("Info", systemImage: "gearshape.fill") }
                .tag(4)
        }
        .tint(.primary)
    }
}
