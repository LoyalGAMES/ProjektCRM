import SwiftUI

// MARK: - Color Theme
extension Color {
    static let bg = Color(hex: "0A0E1A")
    static let surface = Color(hex: "131829")
    static let surfaceLight = Color(hex: "1C2237")
    static let surfaceHL = Color(hex: "252B44")
    static let card = Color(hex: "161B2E")
    static let border = Color(hex: "1E2440")
    static let text2 = Color(hex: "8B95B5")
    static let text3 = Color(hex: "5A6380")
    static let primary = Color(hex: "4A90D9")
    static let primaryLight = Color(hex: "6BA5E7")
    static let secondary = Color(hex: "7C5CFC")
    static let success = Color(hex: "34D399")
    static let warning = Color(hex: "FBBF24")
    static let danger = Color(hex: "F87171")

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}

// MARK: - Category
enum GoalCategory: String, CaseIterable, Codable {
    case career, health, finance, education, personal, relationships, other

    var label: String {
        switch self {
        case .career: "Kariera"; case .health: "Zdrowie"; case .finance: "Finanse"
        case .education: "Edukacja"; case .personal: "Osobiste"
        case .relationships: "Relacje"; case .other: "Inne"
        }
    }

    var icon: String {
        switch self {
        case .career: "briefcase.fill"; case .health: "heart.fill"; case .finance: "dollarsign.circle.fill"
        case .education: "book.fill"; case .personal: "star.fill"
        case .relationships: "person.2.fill"; case .other: "folder.fill"
        }
    }

    var color: Color {
        switch self {
        case .career: .indigo; case .health: .teal; case .finance: .orange
        case .education: .purple; case .personal: .pink
        case .relationships: .cyan; case .other: .gray
        }
    }
}

// MARK: - Priority
enum GoalPriority: String, CaseIterable, Codable {
    case critical, high, medium, low

    var label: String {
        switch self {
        case .critical: "Krytyczny"; case .high: "Wysoki"; case .medium: "Średni"; case .low: "Niski"
        }
    }

    var color: Color {
        switch self {
        case .critical: Color(hex: "EF4444"); case .high: Color(hex: "F97316")
        case .medium: Color(hex: "EAB308"); case .low: Color(hex: "22C55E")
        }
    }
}

// MARK: - Status
enum GoalStatus: String, CaseIterable, Codable {
    case draft, active, paused, completed, abandoned

    var label: String {
        switch self {
        case .draft: "Szkic"; case .active: "Aktywny"; case .paused: "Wstrzymany"
        case .completed: "Ukończony"; case .abandoned: "Porzucony"
        }
    }

    var color: Color {
        switch self {
        case .draft: .text2; case .active: .primary; case .paused: .warning
        case .completed: .success; case .abandoned: .danger
        }
    }
}

// MARK: - Countdown Helper
struct Countdown {
    let text: String
    let days: Int
    let overdue: Bool

    static func from(_ dateStr: String?) -> Countdown {
        guard let dateStr, let target = ISO8601DateFormatter().date(from: dateStr + "T23:59:59Z") ?? Self.parseDate(dateStr) else {
            return Countdown(text: "---", days: 0, overdue: false)
        }
        let diff = Calendar.current.dateComponents([.day, .hour], from: Date(), to: target)
        let days = (diff.day ?? 0)
        if days < 0 { return Countdown(text: "\(abs(days))d po terminie", days: days, overdue: true) }
        if days == 0 { return Countdown(text: "Dzisiaj!", days: 0, overdue: false) }
        if days <= 7 { return Countdown(text: "\(days)d \(diff.hour ?? 0)h", days: days, overdue: false) }
        return Countdown(text: "\(days) dni", days: days, overdue: false)
    }

    private static func parseDate(_ str: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: str)
    }
}

func formatDate(_ str: String?) -> String {
    guard let str else { return "" }
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    guard let date = f.date(from: str) else { return str }
    f.dateFormat = "d MMM yyyy"
    f.locale = Locale(identifier: "pl_PL")
    return f.string(from: date)
}

func riskColor(_ score: Double) -> Color {
    if score >= 0.6 { return Color(hex: "EF4444") }
    if score >= 0.4 { return Color(hex: "F97316") }
    if score >= 0.2 { return Color(hex: "EAB308") }
    return Color(hex: "22C55E")
}
