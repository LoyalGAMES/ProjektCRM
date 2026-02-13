import Foundation

struct WidgetAPI {
    static var baseURL: String {
        UserDefaults(suiteName: "group.com.goaltracker.smart")?.string(forKey: "apiBaseURL")
            ?? "https://webbiloo.atthost24.pl/api"
    }

    static func fetchActiveGoals() async -> [WidgetGoal] {
        guard let url = URL(string: "\(baseURL)/goals.php?status=active&sort=deadline") else { return [] }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            return try JSONDecoder().decode([WidgetGoal].self, from: data)
        } catch {
            return []
        }
    }
}
