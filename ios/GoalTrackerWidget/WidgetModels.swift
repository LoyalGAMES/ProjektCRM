import Foundation

struct WidgetGoal: Codable, Identifiable {
    let id: String
    let title: String
    let category: String?
    let priority: String?
    let status: String?
    let progress: Double?
    let target_date: String?
    let color: String?

    var progressValue: Double { progress ?? 0 }

    var categoryIcon: String {
        switch category {
        case "career": "briefcase.fill"; case "health": "heart.fill"; case "finance": "dollarsign.circle.fill"
        case "education": "book.fill"; case "personal": "star.fill"
        case "relationships": "person.2.fill"; default: "folder.fill"
        }
    }

    var countdown: (text: String, days: Int, overdue: Bool) {
        guard let target_date, let target = Self.parseDate(target_date) else {
            return ("---", 0, false)
        }
        let diff = Calendar.current.dateComponents([.day, .hour], from: Date(), to: target)
        let days = diff.day ?? 0
        if days < 0 { return ("\(abs(days))d po terminie", days, true) }
        if days == 0 { return ("Dzisiaj!", 0, false) }
        if days <= 7 { return ("\(days)d \(diff.hour ?? 0)h", days, false) }
        return ("\(days) dni", days, false)
    }

    private static func parseDate(_ str: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = .current
        guard let d = f.date(from: str) else { return nil }
        return Calendar.current.date(bySettingHour: 23, minute: 59, second: 59, of: d)
    }
}
