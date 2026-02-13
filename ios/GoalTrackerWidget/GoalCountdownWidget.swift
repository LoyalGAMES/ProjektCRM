import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct GoalTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> GoalEntry {
        GoalEntry(date: Date(), goals: [
            WidgetGoal(id: "1", title: "Przykładowy cel", category: "personal", priority: "high", status: "active", progress: 65, target_date: "2026-06-15", color: "#FF6B9D")
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

struct GoalEntry: TimelineEntry {
    let date: Date
    let goals: [WidgetGoal]
}

// MARK: - Small
struct SmallWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        if let goal = entry.goals.first {
            let cd = goal.countdown
            VStack(alignment: .leading, spacing: 6) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: categoryGradient(goal.category), startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 30, height: 30)
                    Text(initials(goal.title))
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                }

                Text(goal.title)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(2)
                    .foregroundColor(Color(hex: "1A1D2E"))

                Spacer()

                Text(cd.text)
                    .font(.system(size: 20, weight: .heavy, design: .rounded))
                    .foregroundColor(cd.overdue ? Color(hex: "EF4444") : Color(hex: "FF6B6B"))

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2).fill(Color(hex: "ECEEF5")).frame(height: 4)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color(hex: goal.color ?? "FF6B6B"))
                            .frame(width: geo.size.width * goal.progressValue / 100, height: 4)
                    }
                }
                .frame(height: 4)

                Text("\(Int(goal.progressValue))%")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color(hex: "6B7085"))
            }
            .padding()
            .containerBackground(.white, for: .widget)
        } else {
            VStack(spacing: 6) {
                Circle().fill(Color(hex: "FFF0F0")).frame(width: 36, height: 36)
                    .overlay(Text("GT").font(.system(size: 12, weight: .black)).foregroundColor(Color(hex: "FF6B6B")))
                Text("Brak celów").font(.caption).foregroundColor(Color(hex: "A0A5BA"))
            }
            .containerBackground(.white, for: .widget)
        }
    }
}

// MARK: - Medium
struct MediumWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        HStack(spacing: 14) {
            ForEach(entry.goals.prefix(3)) { goal in
                let cd = goal.countdown
                VStack(alignment: .leading, spacing: 4) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: categoryGradient(goal.category), startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 24, height: 24)
                        Text(initials(goal.title))
                            .font(.system(size: 8, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                    }
                    Text(goal.title)
                        .font(.system(size: 11, weight: .semibold))
                        .lineLimit(2)
                        .foregroundColor(Color(hex: "1A1D2E"))
                    Spacer()
                    Text(cd.text)
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
                        .foregroundColor(cd.overdue ? Color(hex: "EF4444") : Color(hex: "FF6B6B"))
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2).fill(Color(hex: "ECEEF5")).frame(height: 3)
                            RoundedRectangle(cornerRadius: 2).fill(Color(hex: goal.color ?? "FF6B6B"))
                                .frame(width: geo.size.width * goal.progressValue / 100, height: 3)
                        }
                    }
                    .frame(height: 3)
                    Text("\(Int(goal.progressValue))%")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(hex: "A0A5BA"))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .containerBackground(.white, for: .widget)
    }
}

// MARK: - Large
struct LargeWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                ZStack {
                    Circle().fill(Color(hex: "FFF0F0")).frame(width: 28, height: 28)
                    Text("GT").font(.system(size: 10, weight: .black, design: .rounded)).foregroundColor(Color(hex: "FF6B6B"))
                }
                Text("GoalTracker")
                    .font(.system(size: 15, weight: .heavy, design: .rounded))
                    .foregroundColor(Color(hex: "1A1D2E"))
                Spacer()
                Text("\(entry.goals.count) celów")
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "A0A5BA"))
            }

            Divider()

            ForEach(entry.goals.prefix(5)) { goal in
                let cd = goal.countdown
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: categoryGradient(goal.category), startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 28, height: 28)
                        Text(initials(goal.title))
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(goal.title)
                            .font(.system(size: 12, weight: .semibold))
                            .lineLimit(1)
                            .foregroundColor(Color(hex: "1A1D2E"))
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 2).fill(Color(hex: "ECEEF5")).frame(height: 3)
                                RoundedRectangle(cornerRadius: 2).fill(Color(hex: goal.color ?? "FF6B6B"))
                                    .frame(width: geo.size.width * goal.progressValue / 100, height: 3)
                            }
                        }
                        .frame(height: 3)
                    }

                    VStack(alignment: .trailing, spacing: 2) {
                        Text(cd.text)
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundColor(cd.overdue ? Color(hex: "EF4444") : Color(hex: "FF6B6B"))
                        Text("\(Int(goal.progressValue))%")
                            .font(.system(size: 9))
                            .foregroundColor(Color(hex: "A0A5BA"))
                    }
                }
                .padding(.vertical, 3)
            }

            if entry.goals.isEmpty {
                Spacer()
                Text("Brak aktywnych celów").font(.subheadline).foregroundColor(Color(hex: "A0A5BA")).frame(maxWidth: .infinity)
                Spacer()
            }
        }
        .padding()
        .containerBackground(.white, for: .widget)
    }
}

// MARK: - Widget
struct GoalCountdownWidget: Widget {
    let kind = "GoalCountdownWidget"

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

// MARK: - Helpers
func initials(_ title: String) -> String {
    let w = title.split(separator: " ").prefix(2)
    if w.count >= 2 { return String(w[0].prefix(1) + w[1].prefix(1)).uppercased() }
    return String(title.prefix(2)).uppercased()
}

func categoryGradient(_ cat: String?) -> [Color] {
    switch cat {
    case "career": [Color(hex: "A78BFA"), Color(hex: "818CF8")]
    case "health": [Color(hex: "2DD4BF"), Color(hex: "34D399")]
    case "finance": [Color(hex: "FB923C"), Color(hex: "F97316")]
    case "education": [Color(hex: "60A5FA"), Color(hex: "3B82F6")]
    case "personal": [Color(hex: "FF6B9D"), Color(hex: "FF6B6B")]
    case "relationships": [Color(hex: "4ADE80"), Color(hex: "22C55E")]
    default: [Color(hex: "94A3B8"), Color(hex: "64748B")]
    }
}

// Color hex init for widget module
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
