import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct GoalTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> GoalEntry {
        GoalEntry(date: Date(), goals: [
            WidgetGoal(id: "1", title: "Przykładowy cel", category: "personal", priority: "high", status: "active", progress: 65, target_date: "2026-06-15", color: "#4A90D9")
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (GoalEntry) -> Void) {
        Task {
            let goals = await WidgetAPI.fetchActiveGoals()
            completion(GoalEntry(date: Date(), goals: goals.isEmpty ? placeholder(in: context).goals : goals))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GoalEntry>) -> Void) {
        Task {
            let goals = await WidgetAPI.fetchActiveGoals()
            let entry = GoalEntry(date: Date(), goals: goals)
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }
}

// MARK: - Entry
struct GoalEntry: TimelineEntry {
    let date: Date
    let goals: [WidgetGoal]
}

// MARK: - Small Widget View (single goal countdown)
struct SmallWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        if let goal = entry.goals.first {
            let cd = goal.countdown
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: goal.categoryIcon)
                        .font(.system(size: 14))
                        .foregroundColor(Color(hex: goal.color ?? "4A90D9"))
                    Spacer()
                    Circle().fill(priorityColor(goal.priority)).frame(width: 8, height: 8)
                }

                Text(goal.title)
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(2)
                    .foregroundColor(.white)

                Spacer()

                Text(cd.text)
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .foregroundColor(cd.overdue ? Color(hex: "F87171") : Color(hex: "4A90D9"))

                // Progress
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3).fill(Color.white.opacity(0.1)).frame(height: 6)
                        RoundedRectangle(cornerRadius: 3).fill(Color(hex: goal.color ?? "4A90D9"))
                            .frame(width: geo.size.width * goal.progressValue / 100, height: 6)
                    }
                }
                .frame(height: 6)

                Text("\(Int(goal.progressValue))%")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white.opacity(0.6))
            }
            .padding()
            .containerBackground(Color(hex: "131829"), for: .widget)
        } else {
            VStack {
                Image(systemName: "target")
                    .font(.largeTitle)
                    .foregroundColor(.white.opacity(0.3))
                Text("Brak celów")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
            }
            .containerBackground(Color(hex: "131829"), for: .widget)
        }
    }

    func priorityColor(_ p: String?) -> Color {
        switch p {
        case "critical": Color(hex: "EF4444"); case "high": Color(hex: "F97316")
        case "medium": Color(hex: "EAB308"); default: Color(hex: "22C55E")
        }
    }
}

// MARK: - Medium Widget View (multiple goals)
struct MediumWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        HStack(spacing: 12) {
            ForEach(entry.goals.prefix(3)) { goal in
                let cd = goal.countdown
                VStack(alignment: .leading, spacing: 4) {
                    Image(systemName: goal.categoryIcon)
                        .font(.system(size: 16))
                        .foregroundColor(Color(hex: goal.color ?? "4A90D9"))

                    Text(goal.title)
                        .font(.system(size: 12, weight: .semibold))
                        .lineLimit(2)
                        .foregroundColor(.white)

                    Spacer()

                    Text(cd.text)
                        .font(.system(size: 16, weight: .heavy, design: .rounded))
                        .foregroundColor(cd.overdue ? Color(hex: "F87171") : Color(hex: "4A90D9"))

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2).fill(Color.white.opacity(0.1)).frame(height: 4)
                            RoundedRectangle(cornerRadius: 2).fill(Color(hex: goal.color ?? "4A90D9"))
                                .frame(width: geo.size.width * goal.progressValue / 100, height: 4)
                        }
                    }
                    .frame(height: 4)

                    Text("\(Int(goal.progressValue))%")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white.opacity(0.5))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .containerBackground(Color(hex: "131829"), for: .widget)
    }
}

// MARK: - Large Widget View (detailed list)
struct LargeWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "target")
                    .foregroundColor(Color(hex: "4A90D9"))
                Text("GoalTracker")
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundColor(.white)
                Spacer()
                Text("\(entry.goals.count) celów")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
            }

            ForEach(entry.goals.prefix(5)) { goal in
                let cd = goal.countdown
                HStack(spacing: 10) {
                    Image(systemName: goal.categoryIcon)
                        .font(.system(size: 14))
                        .foregroundColor(Color(hex: goal.color ?? "4A90D9"))
                        .frame(width: 28, height: 28)
                        .background(Color(hex: goal.color ?? "4A90D9").opacity(0.15))
                        .cornerRadius(7)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(goal.title)
                            .font(.system(size: 13, weight: .semibold))
                            .lineLimit(1)
                            .foregroundColor(.white)

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 2).fill(Color.white.opacity(0.1)).frame(height: 4)
                                RoundedRectangle(cornerRadius: 2).fill(Color(hex: goal.color ?? "4A90D9"))
                                    .frame(width: geo.size.width * goal.progressValue / 100, height: 4)
                            }
                        }
                        .frame(height: 4)
                    }

                    VStack(alignment: .trailing, spacing: 2) {
                        Text(cd.text)
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(cd.overdue ? Color(hex: "F87171") : Color(hex: "4A90D9"))
                        Text("\(Int(goal.progressValue))%")
                            .font(.system(size: 10))
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                .padding(.vertical, 4)
            }

            if entry.goals.isEmpty {
                Spacer()
                Text("Brak aktywnych celów")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.3))
                    .frame(maxWidth: .infinity)
                Spacer()
            }
        }
        .padding()
        .containerBackground(Color(hex: "131829"), for: .widget)
    }
}

// MARK: - Widget Definition
struct GoalCountdownWidget: Widget {
    let kind: String = "GoalCountdownWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GoalTimelineProvider()) { entry in
            GoalCountdownWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Cele SMART")
        .description("Odliczanie i postęp Twoich celów")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct GoalCountdownWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: GoalEntry

    var body: some View {
        switch family {
        case .systemSmall: SmallWidgetView(entry: entry)
        case .systemMedium: MediumWidgetView(entry: entry)
        case .systemLarge: LargeWidgetView(entry: entry)
        default: SmallWidgetView(entry: entry)
        }
    }
}

// Color extension for widget
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6: (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (r, g, b) = (0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }
}
