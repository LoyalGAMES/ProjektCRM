import SwiftUI

struct PlannerView: View {
    @EnvironmentObject var store: GoalStore
    @State private var viewMode = 0 // 0=timeline, 1=calendar, 2=kanban
    @State private var calMonth = Date()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // View Switch
                    HStack(spacing: 0) {
                        ForEach(Array(["Oś czasu", "Kalendarz", "Kanban"].enumerated()), id: \.offset) { i, label in
                            Button { viewMode = i } label: {
                                Text(label)
                                    .font(.system(size: 14, weight: viewMode == i ? .bold : .medium))
                                    .foregroundColor(viewMode == i ? .white : .text3)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(viewMode == i ? Color.primary : Color.clear)
                                    .cornerRadius(10)
                            }
                        }
                    }
                    .padding(4)
                    .background(Color.card)
                    .cornerRadius(14)

                    switch viewMode {
                    case 0: timelineView
                    case 1: calendarView
                    case 2: kanbanView
                    default: EmptyView()
                    }
                }
                .padding()
            }
            .background(Color.bg)
            .navigationTitle("Planer")
            .navigationDestination(for: String.self) { id in
                GoalDetailView(goalId: id)
            }
            .task { await store.loadGoals() }
        }
    }

    // MARK: - Timeline
    var timelineView: some View {
        let active = store.goals.filter { $0.status == "active" || $0.status == "draft" }
            .sorted { ($0.target_date ?? "") < ($1.target_date ?? "") }
        let now = Date()
        let df = DateFormatter()
        df.dateFormat = "d MMMM yyyy"
        df.locale = Locale(identifier: "pl_PL")

        return VStack(alignment: .leading, spacing: 0) {
            // Today marker
            HStack(spacing: 8) {
                Circle().fill(Color.success).frame(width: 10, height: 10)
                Text("Dzisiaj - \(df.string(from: now))")
                    .font(.system(size: 13, weight: .semibold)).foregroundColor(.success)
                Rectangle().fill(Color.success.opacity(0.3)).frame(height: 1)
            }
            .padding(.bottom, 16)

            ForEach(Array(active.enumerated()), id: \.element.id) { i, goal in
                HStack(alignment: .top, spacing: 8) {
                    // Timeline dot + line
                    VStack(spacing: 0) {
                        Circle().fill(Color(hex: goal.color ?? "4A90D9")).frame(width: 14, height: 14)
                        if i < active.count - 1 {
                            Rectangle().fill(Color.border).frame(width: 2).frame(minHeight: 80)
                        }
                    }
                    .frame(width: 30)

                    // Content
                    NavigationLink(value: goal.id) {
                        let cd = Countdown.from(goal.target_date)
                        let startD = parseDate(goal.start_date ?? goal.created_at ?? "") ?? now
                        let endD = parseDate(goal.target_date ?? "") ?? now
                        let total = endD.timeIntervalSince(startD) / 86400
                        let elapsed = now.timeIntervalSince(startD) / 86400
                        let timePct = total > 0 ? min(100, max(0, (elapsed / total) * 100)) : 0
                        let behind = timePct > (goal.progressValue) + 20

                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                CategoryIcon(category: goal.categoryEnum, size: 28)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(goal.title).font(.system(size: 15, weight: .bold))
                                    Text("\(formatDate(goal.start_date)) → \(formatDate(goal.target_date))")
                                        .font(.system(size: 11)).foregroundColor(.text2)
                                }
                                Spacer()
                                CountdownBadge(targetDate: goal.target_date)
                            }

                            // Dual progress
                            VStack(spacing: 4) {
                                progressRow("Postęp", goal.progressValue, .primary)
                                progressRow("Czas", timePct, behind ? .warning : .text3)
                            }

                            if behind {
                                Label("Cel może być opóźniony", systemImage: "exclamationmark.triangle.fill")
                                    .font(.system(size: 11))
                                    .foregroundColor(.warning)
                                    .padding(6)
                                    .background(Color.warning.opacity(0.1))
                                    .cornerRadius(8)
                            }
                        }
                        .cardStyle()
                    }
                    .buttonStyle(.plain)
                }
            }

            if active.isEmpty {
                EmptyStateView(icon: "calendar", title: "Brak celów do wyświetlenia")
            }
        }
    }

    func progressRow(_ label: String, _ value: Double, _ color: Color) -> some View {
        HStack(spacing: 6) {
            Text(label).font(.system(size: 10)).foregroundColor(.text3).frame(width: 45, alignment: .trailing)
            ProgressBar(value: value, color: color, height: 4)
            Text("\(Int(value))%").font(.system(size: 10)).foregroundColor(.text2).frame(width: 30)
        }
    }

    func parseDate(_ str: String) -> Date? {
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"; return df.date(from: str)
    }

    // MARK: - Calendar
    var calendarView: some View {
        let cal = Calendar.current
        let yr = cal.component(.year, from: calMonth)
        let mo = cal.component(.month, from: calMonth)
        let firstDay = cal.date(from: DateComponents(year: yr, month: mo, day: 1))!
        let daysInMonth = cal.range(of: .day, in: .month, for: firstDay)!.count
        let startDow = (cal.component(.weekday, from: firstDay) + 5) % 7
        let df = DateFormatter()
        df.dateFormat = "LLLL yyyy"; df.locale = Locale(identifier: "pl_PL")

        return VStack(spacing: 12) {
            HStack {
                Button { calMonth = cal.date(byAdding: .month, value: -1, to: calMonth)! } label: {
                    Image(systemName: "chevron.left").font(.title2).foregroundColor(.primary)
                }
                Spacer()
                Text(df.string(from: calMonth).capitalized).font(.system(size: 18, weight: .bold))
                Spacer()
                Button { calMonth = cal.date(byAdding: .month, value: 1, to: calMonth)! } label: {
                    Image(systemName: "chevron.right").font(.title2).foregroundColor(.primary)
                }
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 2) {
                ForEach(["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"], id: \.self) { d in
                    Text(d).font(.system(size: 12, weight: .semibold)).foregroundColor(.text3)
                }

                ForEach(0..<startDow, id: \.self) { _ in Color.clear.frame(height: 44) }

                ForEach(1...daysInMonth, id: \.self) { day in
                    let ds = String(format: "%04d-%02d-%02d", yr, mo, day)
                    let today = df.dateFormat == "yyyy-MM-dd" // hacky but won't match
                    let isToday = ds == DateFormatter.iso.string(from: Date())
                    let dayGoals = store.goals.filter { $0.target_date?.hasPrefix(ds) ?? false }

                    VStack(spacing: 2) {
                        Text("\(day)")
                            .font(.system(size: 14, weight: isToday ? .bold : .regular))
                            .foregroundColor(isToday ? .primary : .text2)
                        HStack(spacing: 2) {
                            ForEach(dayGoals.prefix(3)) { g in
                                Circle().fill(Color(hex: g.color ?? "4A90D9")).frame(width: 6, height: 6)
                            }
                        }
                    }
                    .frame(height: 44)
                    .frame(maxWidth: .infinity)
                    .background(isToday ? Color.primary.opacity(0.2) : Color.clear)
                    .cornerRadius(8)
                }
            }
        }
    }

    // MARK: - Kanban
    var kanbanView: some View {
        let cols: [(String, String, Color)] = [
            ("draft", "Szkice", .text3), ("active", "Aktywne", .primary),
            ("paused", "Wstrzymane", .warning), ("completed", "Ukończone", .success)
        ]

        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: 12) {
                ForEach(cols, id: \.0) { key, label, color in
                    let items = store.goals.filter { $0.status == key }
                    VStack(spacing: 8) {
                        HStack {
                            Text(label).font(.system(size: 15, weight: .bold)).foregroundColor(color)
                            Spacer()
                            Text("\(items.count)").font(.caption).foregroundColor(.text3)
                        }
                        .padding(.bottom, 6)
                        .overlay(alignment: .bottom) { Rectangle().fill(color).frame(height: 3).cornerRadius(2) }

                        ForEach(items) { g in
                            NavigationLink(value: g.id) {
                                VStack(alignment: .leading, spacing: 6) {
                                    CategoryIcon(category: g.categoryEnum, size: 24)
                                    Text(g.title).font(.system(size: 14, weight: .semibold)).lineLimit(2)
                                    HStack {
                                        Text("\(Int(g.progressValue))%").font(.caption2.bold()).foregroundColor(.text2)
                                        Spacer()
                                    }
                                    ProgressBar(value: g.progressValue, color: color, height: 3)
                                }
                                .cardStyle()
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .frame(width: 220)
                }
            }
        }
    }
}

extension DateFormatter {
    static let iso: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()
}
