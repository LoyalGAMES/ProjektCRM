import SwiftUI

struct PlannerView: View {
    @EnvironmentObject var store: GoalStore
    @State private var viewMode = 0
    @State private var calMonth = Date()

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                // Header
                Text("Planer")
                    .font(.system(size: 24, weight: .heavy, design: .rounded))
                    .foregroundColor(.panelText)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // View switch
                HStack(spacing: 0) {
                    ForEach(Array(["Oś czasu", "Kalendarz", "Kanban"].enumerated()), id: \.offset) { i, label in
                        Button { viewMode = i } label: {
                            Text(label)
                                .font(.system(size: 13, weight: viewMode == i ? .bold : .medium))
                                .foregroundColor(viewMode == i ? .white : .panelText3)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(viewMode == i ? Color.accent : Color.clear)
                                .cornerRadius(10)
                        }
                    }
                }
                .padding(3)
                .background(Color.panelCard)
                .cornerRadius(13)

                switch viewMode {
                case 0: timelineView
                case 1: calendarView
                case 2: kanbanView
                default: EmptyView()
                }
            }
            .padding(24)
        }
        .background(Color.panelBg)
        .task { await store.loadGoals() }
    }

    // MARK: - Timeline
    var timelineView: some View {
        let active = store.goals.filter { $0.status == "active" || $0.status == "draft" }
            .sorted { ($0.target_date ?? "") < ($1.target_date ?? "") }
        let now = Date()
        let df = DateFormatter(); df.dateFormat = "d MMMM yyyy"; df.locale = Locale(identifier: "pl_PL")

        return VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Circle().fill(Color.successGreen).frame(width: 8, height: 8)
                Text("Dzisiaj - \(df.string(from: now))")
                    .font(.system(size: 12, weight: .semibold)).foregroundColor(.successGreen)
                Rectangle().fill(Color.successGreen.opacity(0.2)).frame(height: 1)
            }
            .padding(.bottom, 16)

            ForEach(Array(active.enumerated()), id: \.element.id) { i, goal in
                HStack(alignment: .top, spacing: 10) {
                    VStack(spacing: 0) {
                        Circle().fill(goalColor(for: goal)).frame(width: 12, height: 12)
                        if i < active.count - 1 {
                            Rectangle().fill(Color.panelBorder).frame(width: 2).frame(minHeight: 70)
                        }
                    }
                    .frame(width: 24)

                    let cd = Countdown.from(goal.target_date)
                    let startD = parseDate(goal.start_date ?? goal.created_at ?? "") ?? now
                    let endD = parseDate(goal.target_date ?? "") ?? now
                    let total = endD.timeIntervalSince(startD) / 86400
                    let elapsed = now.timeIntervalSince(startD) / 86400
                    let timePct = total > 0 ? min(100, max(0, (elapsed / total) * 100)) : 0
                    let behind = timePct > goal.progressValue + 20

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            GoalAvatar(goal: goal, size: 32)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(goal.title).font(.system(size: 14, weight: .bold)).foregroundColor(.panelText)
                                Text("\(formatDate(goal.start_date)) → \(formatDate(goal.target_date))")
                                    .font(.system(size: 10)).foregroundColor(.panelText3)
                            }
                            Spacer()
                            CountdownBadge(targetDate: goal.target_date)
                        }

                        VStack(spacing: 4) {
                            progressRow("Postęp", goal.progressValue, goalColor(for: goal))
                            progressRow("Czas", timePct, behind ? .warningAmber : .panelText3)
                        }

                        if behind {
                            HStack(spacing: 4) {
                                Circle().fill(Color.warningAmber).frame(width: 6, height: 6)
                                Text("Cel może być opóźniony")
                                    .font(.system(size: 11)).foregroundColor(.warningAmber)
                            }
                            .padding(8)
                            .background(Color.warningBg)
                            .cornerRadius(8)
                        }
                    }
                    .whiteCard()
                }
            }

            if active.isEmpty {
                EmptyStateView(title: "Brak celów do wyświetlenia")
            }
        }
    }

    func progressRow(_ label: String, _ value: Double, _ color: Color) -> some View {
        HStack(spacing: 6) {
            Text(label).font(.system(size: 10)).foregroundColor(.panelText3).frame(width: 40, alignment: .trailing)
            ProgressBar(value: value, color: color, height: 4)
            Text("\(Int(value))%").font(.system(size: 10)).foregroundColor(.panelText2).frame(width: 30)
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
        let df = DateFormatter(); df.dateFormat = "LLLL yyyy"; df.locale = Locale(identifier: "pl_PL")

        return VStack(spacing: 12) {
            HStack {
                Button { calMonth = cal.date(byAdding: .month, value: -1, to: calMonth)! } label: {
                    Image(systemName: "chevron.left").foregroundColor(.accent)
                }
                Spacer()
                Text(df.string(from: calMonth).capitalized)
                    .font(.system(size: 17, weight: .bold)).foregroundColor(.panelText)
                Spacer()
                Button { calMonth = cal.date(byAdding: .month, value: 1, to: calMonth)! } label: {
                    Image(systemName: "chevron.right").foregroundColor(.accent)
                }
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 4) {
                ForEach(["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"], id: \.self) { d in
                    Text(d).font(.system(size: 11, weight: .semibold)).foregroundColor(.panelText3)
                }
                ForEach(0..<startDow, id: \.self) { _ in Color.clear.frame(height: 44) }
                ForEach(1...daysInMonth, id: \.self) { day in
                    let ds = String(format: "%04d-%02d-%02d", yr, mo, day)
                    let isToday = ds == DateFormatter.iso.string(from: Date())
                    let dayGoals = store.goals.filter { $0.target_date?.hasPrefix(ds) ?? false }

                    VStack(spacing: 2) {
                        Text("\(day)")
                            .font(.system(size: 13, weight: isToday ? .bold : .regular))
                            .foregroundColor(isToday ? .accent : .panelText)
                        HStack(spacing: 2) {
                            ForEach(dayGoals.prefix(3)) { g in
                                Circle().fill(goalColor(for: g)).frame(width: 5, height: 5)
                            }
                        }
                    }
                    .frame(height: 44)
                    .frame(maxWidth: .infinity)
                    .background(isToday ? Color.accentBg : Color.clear)
                    .cornerRadius(8)
                }
            }
        }
        .whiteCard()
    }

    // MARK: - Kanban
    var kanbanView: some View {
        let cols: [(String, String, Color)] = [
            ("draft", "Szkice", .panelText3), ("active", "Aktywne", .infoBlue),
            ("paused", "Wstrzymane", .warningAmber), ("completed", "Ukończone", .successGreen)
        ]

        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: 12) {
                ForEach(cols, id: \.0) { key, label, color in
                    let items = store.goals.filter { $0.status == key }
                    VStack(spacing: 8) {
                        HStack {
                            Circle().fill(color).frame(width: 8, height: 8)
                            Text(label).font(.system(size: 14, weight: .bold)).foregroundColor(.panelText)
                            Spacer()
                            Text("\(items.count)")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.panelText3)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.panelCard)
                                .cornerRadius(8)
                        }
                        .padding(.bottom, 4)

                        ForEach(items) { g in
                            VStack(alignment: .leading, spacing: 8) {
                                GoalAvatar(goal: g, size: 28)
                                Text(g.title)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.panelText)
                                    .lineLimit(2)
                                ProgressBar(value: g.progressValue, color: color, height: 3)
                                Text("\(Int(g.progressValue))%")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.panelText3)
                            }
                            .whiteCard()
                        }
                    }
                    .frame(width: 200)
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
