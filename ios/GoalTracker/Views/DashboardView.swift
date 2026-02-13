import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var store: GoalStore
    @State private var activeGoals: [Goal] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Stats
                    if let s = store.stats {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            StatCard(value: "\(s.active)", label: "Aktywne cele", color: .primary)
                            StatCard(value: "\(s.completed)", label: "Ukończone", color: .success)
                            StatCard(value: "\(Int(s.averageProgress))%", label: "Średni postęp", color: .secondary)
                            StatCard(value: "\(s.total)", label: "Łącznie", color: .primary)
                        }
                    }

                    // Countdown Widgets
                    if !activeGoals.isEmpty {
                        SectionHeader(title: "Odliczanie do celów")
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(activeGoals) { goal in
                                    NavigationLink(value: goal.id) {
                                        CountdownWidget(goal: goal)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, 2)
                        }
                    }

                    // Upcoming Deadlines
                    if let upcoming = store.stats?.upcomingDeadlines, !upcoming.isEmpty {
                        SectionHeader(title: "Zbliżające się terminy")
                        ForEach(upcoming) { goal in
                            NavigationLink(value: goal.id) {
                                DeadlineRow(goal: goal)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    // High Risks
                    if let risks = store.stats?.highRisks, !risks.isEmpty {
                        SectionHeader(title: "Wysokie ryzyka")
                        ForEach(risks) { risk in
                            RiskRow(risk: risk)
                        }
                    }
                }
                .padding()
            }
            .background(Color.bg)
            .navigationTitle("Dashboard")
            .navigationDestination(for: String.self) { id in
                GoalDetailView(goalId: id)
            }
            .refreshable {
                await refresh()
            }
            .task { await refresh() }
        }
    }

    func refresh() async {
        await store.loadStats()
        activeGoals = (try? await APIService.shared.getGoals(status: "active", sort: "deadline")) ?? []
    }
}

// MARK: - Countdown Widget
struct CountdownWidget: View {
    let goal: Goal

    var body: some View {
        let cd = Countdown.from(goal.target_date)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                CategoryIcon(category: goal.categoryEnum, size: 28)
                Spacer()
                Circle().fill(goal.priorityEnum.color).frame(width: 10, height: 10)
            }

            Text(goal.title)
                .font(.system(size: 15, weight: .semibold))
                .lineLimit(2)
                .frame(height: 40, alignment: .topLeading)

            Text(cd.text)
                .font(.system(size: 24, weight: .heavy, design: .rounded))
                .foregroundColor(cd.overdue ? .danger : .primary)

            ProgressBar(value: goal.progressValue)
            Text("\(Int(goal.progressValue))%")
                .font(.caption2)
                .foregroundColor(.text2)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .frame(width: 200)
        .cardStyle()
    }
}

// MARK: - Deadline Row
struct DeadlineRow: View {
    let goal: Goal

    var body: some View {
        HStack(spacing: 12) {
            CategoryIcon(category: goal.categoryEnum, size: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(goal.title).font(.system(size: 15, weight: .semibold))
                Text(formatDate(goal.target_date)).font(.caption).foregroundColor(.text2)
            }
            Spacer()
            CountdownBadge(targetDate: goal.target_date)
        }
        .padding(14)
        .background(Color.card)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.border, lineWidth: 1))
    }
}

// MARK: - Risk Row
struct RiskRow: View {
    let risk: Risk

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(risk.title).font(.system(size: 15, weight: .semibold))
                if let gt = risk.goal_title { Text(gt).font(.caption).foregroundColor(.text3) }
            }
            Spacer()
            BadgeView(text: "\(Int(risk.scoreValue * 100))%", color: riskColor(risk.scoreValue))
        }
        .cardStyle(borderColor: riskColor(risk.scoreValue).opacity(0.3))
        .overlay(alignment: .leading) {
            Rectangle().fill(riskColor(risk.scoreValue)).frame(width: 4).cornerRadius(2)
        }
    }
}
