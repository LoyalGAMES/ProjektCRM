import SwiftUI

// MARK: - Color Theme (Modern split-panel design)
extension Color {
    // Dark sidebar
    static let sidebarBg = Color(hex: "1A1D2E")
    static let sidebarLight = Color(hex: "252842")
    static let sidebarText = Color(hex: "A0A3B5")
    static let sidebarTextDim = Color(hex: "5C5F72")
    static let decorCircle = Color(hex: "2A2D42")

    // White panel
    static let panelBg = Color.white
    static let panelCard = Color(hex: "F8F9FC")
    static let panelBorder = Color(hex: "ECEEF5")
    static let panelText = Color(hex: "1A1D2E")
    static let panelText2 = Color(hex: "6B7085")
    static let panelText3 = Color(hex: "A0A5BA")

    // Accent
    static let accent = Color(hex: "FF6B6B")
    static let accentLight = Color(hex: "FF8E8E")
    static let accentBg = Color(hex: "FFF0F0")

    // Semantic
    static let successGreen = Color(hex: "34D399")
    static let successBg = Color(hex: "ECFDF5")
    static let warningAmber = Color(hex: "F59E0B")
    static let warningBg = Color(hex: "FFFBEB")
    static let dangerRed = Color(hex: "EF4444")
    static let dangerBg = Color(hex: "FEF2F2")
    static let infoBlue = Color(hex: "3B82F6")
    static let infoBg = Color(hex: "EFF6FF")

    // Goal circle colors
    static let goalPink = Color(hex: "FF6B9D")
    static let goalPurple = Color(hex: "A78BFA")
    static let goalBlue = Color(hex: "60A5FA")
    static let goalTeal = Color(hex: "2DD4BF")
    static let goalOrange = Color(hex: "FB923C")
    static let goalGreen = Color(hex: "4ADE80")
    static let goalYellow = Color(hex: "FACC15")

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

    var initials: String {
        switch self {
        case .career: "KA"; case .health: "ZD"; case .finance: "FI"
        case .education: "ED"; case .personal: "OS"
        case .relationships: "RE"; case .other: "IN"
        }
    }

    var color: Color {
        switch self {
        case .career: .goalPurple; case .health: .goalTeal; case .finance: .goalOrange
        case .education: .goalBlue; case .personal: .goalPink
        case .relationships: .goalGreen; case .other: .panelText3
        }
    }

    var gradient: [Color] {
        switch self {
        case .career: [Color(hex: "A78BFA"), Color(hex: "818CF8")]
        case .health: [Color(hex: "2DD4BF"), Color(hex: "34D399")]
        case .finance: [Color(hex: "FB923C"), Color(hex: "F97316")]
        case .education: [Color(hex: "60A5FA"), Color(hex: "3B82F6")]
        case .personal: [Color(hex: "FF6B9D"), Color(hex: "FF6B6B")]
        case .relationships: [Color(hex: "4ADE80"), Color(hex: "22C55E")]
        case .other: [Color(hex: "94A3B8"), Color(hex: "64748B")]
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
        case .critical: .dangerRed; case .high: .goalOrange
        case .medium: .warningAmber; case .low: .successGreen
        }
    }

    var bgColor: Color {
        switch self {
        case .critical: .dangerBg; case .high: Color(hex: "FFF7ED")
        case .medium: .warningBg; case .low: .successBg
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
        case .draft: .panelText3; case .active: .infoBlue; case .paused: .warningAmber
        case .completed: .successGreen; case .abandoned: .dangerRed
        }
    }

    var bgColor: Color {
        switch self {
        case .draft: .panelCard; case .active: .infoBg; case .paused: .warningBg
        case .completed: .successBg; case .abandoned: .dangerBg
        }
    }
}

// MARK: - Countdown
struct Countdown {
    let text: String
    let days: Int
    let overdue: Bool

    static func from(_ dateStr: String?) -> Countdown {
        guard let dateStr, let target = ISO8601DateFormatter().date(from: dateStr + "T23:59:59Z") ?? Self.parseDate(dateStr) else {
            return Countdown(text: "---", days: 0, overdue: false)
        }
        let diff = Calendar.current.dateComponents([.day, .hour], from: Date(), to: target)
        let days = diff.day ?? 0
        if days < 0 { return Countdown(text: "\(abs(days))d po terminie", days: days, overdue: true) }
        if days == 0 { return Countdown(text: "Dzisiaj!", days: 0, overdue: false) }
        if days <= 7 { return Countdown(text: "\(days)d \(diff.hour ?? 0)h", days: days, overdue: false) }
        return Countdown(text: "\(days) dni", days: days, overdue: false)
    }

    private static func parseDate(_ str: String) -> Date? {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.date(from: str)
    }
}

func formatDate(_ str: String?) -> String {
    guard let str else { return "" }
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
    guard let date = f.date(from: str) else { return str }
    f.dateFormat = "d MMM yyyy"; f.locale = Locale(identifier: "pl_PL")
    return f.string(from: date)
}

func riskColor(_ score: Double) -> Color {
    if score >= 0.6 { return .dangerRed }
    if score >= 0.4 { return .goalOrange }
    if score >= 0.2 { return .warningAmber }
    return .successGreen
}

// Goal color from hex/string
func goalColor(for goal: Goal) -> Color {
    if let hex = goal.color, !hex.isEmpty { return Color(hex: hex) }
    return goal.categoryEnum.color
}

func goalGradient(for goal: Goal) -> LinearGradient {
    let cols = goal.categoryEnum.gradient
    return LinearGradient(colors: cols, startPoint: .topLeading, endPoint: .bottomTrailing)
}

func goalInitials(_ title: String) -> String {
    let words = title.split(separator: " ").prefix(2)
    if words.count >= 2 { return String(words[0].prefix(1) + words[1].prefix(1)).uppercased() }
    return String(title.prefix(2)).uppercased()
}
