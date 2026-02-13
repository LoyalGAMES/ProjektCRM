import Foundation

// MARK: - Goal
struct Goal: Codable, Identifiable {
    let id: String
    var title: String
    var description: String?
    var category: String?
    var priority: String?
    var status: String?
    var progress: Double?
    var smart_specific: String?
    var smart_measurable: String?
    var smart_achievable: String?
    var smart_relevant: String?
    var smart_time_bound: String?
    var smart_score: Double?
    var start_date: String?
    var target_date: String?
    var completed_date: String?
    var color: String?
    var icon: String?
    var parent_goal_id: String?
    var sort_order: Int?
    var created_at: String?
    var updated_at: String?

    // Relations (only in detail)
    var milestones: [Milestone]?
    var tasks: [GoalTask]?
    var risks: [Risk]?
    var progressLogs: [ProgressLog]?
    var subGoals: [Goal]?

    var categoryEnum: GoalCategory { GoalCategory(rawValue: category ?? "personal") ?? .personal }
    var priorityEnum: GoalPriority { GoalPriority(rawValue: priority ?? "medium") ?? .medium }
    var statusEnum: GoalStatus { GoalStatus(rawValue: status ?? "draft") ?? .draft }
    var progressValue: Double { progress ?? 0 }

    var smartScore: Double {
        let fields = [smart_specific, smart_measurable, smart_achievable, smart_relevant, smart_time_bound]
        let filled = fields.filter { ($0 ?? "").trimmingCharacters(in: .whitespaces).count > 10 }.count
        return Double(filled) / 5.0
    }
}

// MARK: - Milestone
struct Milestone: Codable, Identifiable {
    let id: String
    var goal_id: String?
    var title: String
    var description: String?
    var target_date: String?
    var completed_date: String?
    var is_completed: IntOrBool?
    var sort_order: Int?

    var isDone: Bool { is_completed?.boolValue ?? false }
}

// Helper to decode both int and bool from PHP
enum IntOrBool: Codable {
    case int(Int)
    case bool(Bool)
    case string(String)

    var boolValue: Bool {
        switch self {
        case .int(let v): return v != 0
        case .bool(let v): return v
        case .string(let v): return v == "1" || v == "true"
        }
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let v = try? c.decode(Int.self) { self = .int(v); return }
        if let v = try? c.decode(Bool.self) { self = .bool(v); return }
        if let v = try? c.decode(String.self) { self = .string(v); return }
        self = .int(0)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .int(let v): try c.encode(v)
        case .bool(let v): try c.encode(v)
        case .string(let v): try c.encode(v)
        }
    }
}

// MARK: - Task
struct GoalTask: Codable, Identifiable {
    let id: String
    var goal_id: String?
    var milestone_id: String?
    var title: String
    var description: String?
    var status: String?
    var priority: String?
    var due_date: String?
    var completed_date: String?
    var estimated_hours: Double?
    var actual_hours: Double?
    var sort_order: Int?

    var priorityEnum: GoalPriority { GoalPriority(rawValue: priority ?? "medium") ?? .medium }
    var isDone: Bool { status == "done" }
}

// MARK: - Risk
struct Risk: Codable, Identifiable {
    let id: String
    var goal_id: String?
    var title: String
    var description: String?
    var category: String?
    var probability: String?
    var impact: String?
    var risk_score: Double?
    var status: String?
    var mitigation_plan: String?
    var contingency_plan: String?
    var trigger_conditions: String?
    var owner: String?
    var goal_title: String?

    var scoreValue: Double { risk_score ?? 0 }

    static let probLabels: [String: String] = [
        "very_low": "B. niskie", "low": "Niskie", "medium": "Średnie",
        "high": "Wysokie", "very_high": "B. wysokie"
    ]
    static let impactLabels: [String: String] = [
        "negligible": "Znikomy", "minor": "Mały", "moderate": "Umiarkowany",
        "major": "Duży", "critical": "Krytyczny"
    ]
}

// MARK: - Progress Log
struct ProgressLog: Codable, Identifiable {
    let id: String
    var goal_id: String?
    var date: String?
    var progress_value: Double?
    var notes: String?
    var mood: String?
    var hours_spent: Double?
    var obstacles: String?
    var achievements: String?
}

// MARK: - Dashboard Stats
struct DashboardStats: Codable {
    let total: Int
    let active: Int
    let completed: Int
    let averageProgress: Double
    let upcomingDeadlines: [Goal]?
    let highRisks: [Risk]?
}

// MARK: - Form Data
struct GoalFormData {
    var title = ""
    var description = ""
    var category: GoalCategory = .personal
    var priority: GoalPriority = .medium
    var startDate = Date()
    var targetDate = Calendar.current.date(byAdding: .month, value: 3, to: Date()) ?? Date()
    var smartSpecific = ""
    var smartMeasurable = ""
    var smartAchievable = ""
    var smartRelevant = ""
    var smartTimeBound = ""
    var color = "#4A90D9"

    var smartScore: Double {
        let fields = [smartSpecific, smartMeasurable, smartAchievable, smartRelevant, smartTimeBound]
        return Double(fields.filter { $0.trimmingCharacters(in: .whitespaces).count > 10 }.count) / 5.0
    }

    var payload: [String: Any] {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        return [
            "title": title, "description": description,
            "category": category.rawValue, "priority": priority.rawValue,
            "start_date": df.string(from: startDate), "target_date": df.string(from: targetDate),
            "smart_specific": smartSpecific, "smart_measurable": smartMeasurable,
            "smart_achievable": smartAchievable, "smart_relevant": smartRelevant,
            "smart_time_bound": smartTimeBound, "color": color,
        ]
    }

    mutating func load(from g: Goal) {
        title = g.title
        description = g.description ?? ""
        category = g.categoryEnum
        priority = g.priorityEnum
        smartSpecific = g.smart_specific ?? ""
        smartMeasurable = g.smart_measurable ?? ""
        smartAchievable = g.smart_achievable ?? ""
        smartRelevant = g.smart_relevant ?? ""
        smartTimeBound = g.smart_time_bound ?? ""
        color = g.color ?? "#4A90D9"
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        if let s = g.start_date, let d = df.date(from: s) { startDate = d }
        if let t = g.target_date, let d = df.date(from: t) { targetDate = d }
    }
}
