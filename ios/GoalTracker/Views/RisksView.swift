import SwiftUI

struct RisksView: View {
    @EnvironmentObject var store: GoalStore
    @State private var allRisks: [Risk] = []
    @State private var isLoading = true

    let probs = ["very_high", "high", "medium", "low", "very_low"]
    let impacts = ["negligible", "minor", "moderate", "major", "critical"]
    let probValues: [String: Double] = ["very_low": 0.1, "low": 0.3, "medium": 0.5, "high": 0.7, "very_high": 0.9]
    let impactValues: [String: Double] = ["negligible": 0.1, "minor": 0.3, "moderate": 0.5, "major": 0.7, "critical": 0.9]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                Text("Macierz Ryzyk")
                    .font(.system(size: 24, weight: .heavy, design: .rounded))
                    .foregroundColor(.panelText)

                if isLoading {
                    ProgressView().tint(.accent).frame(maxWidth: .infinity).padding(60)
                } else {
                    // Stats
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        StatCard(value: "\(allRisks.filter { $0.scoreValue >= 0.5 }.count)", label: "Krytyczne", color: .dangerRed)
                        StatCard(value: "\(allRisks.filter { $0.scoreValue >= 0.3 && $0.scoreValue < 0.5 }.count)", label: "Wysokie", color: .goalOrange)
                        StatCard(value: "\(allRisks.filter { $0.scoreValue >= 0.15 && $0.scoreValue < 0.3 }.count)", label: "Średnie", color: .warningAmber)
                        StatCard(value: "\(allRisks.filter { $0.scoreValue < 0.15 }.count)", label: "Niskie", color: .successGreen)
                    }

                    // Matrix
                    ScrollView(.horizontal, showsIndicators: false) { matrixGrid }

                    // Legend
                    HStack(spacing: 14) {
                        legendDot("Niskie", .successGreen)
                        legendDot("Średnie", .warningAmber)
                        legendDot("Wysokie", .goalOrange)
                        legendDot("Krytyczne", .dangerRed)
                    }
                    .frame(maxWidth: .infinity)

                    // Risk list
                    SectionHeader(title: "Lista Ryzyk")

                    if allRisks.isEmpty {
                        EmptyStateView(title: "Brak ryzyk")
                    }

                    ForEach(allRisks.sorted { $0.scoreValue > $1.scoreValue }) { r in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(r.title).font(.system(size: 14, weight: .bold)).foregroundColor(.panelText)
                                Spacer()
                                BadgeView(text: "\(Int(r.scoreValue * 100))%", color: riskColor(r.scoreValue))
                            }
                            if let gt = r.goal_title {
                                Text(gt).font(.system(size: 11)).foregroundColor(.panelText3)
                            }
                            if let d = r.description, !d.isEmpty {
                                Text(d).font(.system(size: 12)).foregroundColor(.panelText2)
                            }
                            HStack(spacing: 6) {
                                BadgeView(text: "P: \(Risk.probLabels[r.probability ?? ""] ?? "")", color: .panelText2, bgColor: .panelCard)
                                BadgeView(text: "I: \(Risk.impactLabels[r.impact ?? ""] ?? "")", color: .panelText2, bgColor: .panelCard)
                            }
                            if let m = r.mitigation_plan, !m.isEmpty {
                                Text(m)
                                    .font(.system(size: 12))
                                    .foregroundColor(.panelText2)
                                    .padding(10)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.panelCard)
                                    .cornerRadius(8)
                            }
                        }
                        .whiteCard(borderColor: riskColor(r.scoreValue).opacity(0.3))
                    }
                }
            }
            .padding(24)
        }
        .background(Color.panelBg)
        .task { await loadAllRisks() }
    }

    var matrixGrid: some View {
        VStack(spacing: 3) {
            HStack(spacing: 3) {
                Text("").frame(width: 56)
                ForEach(impacts, id: \.self) { i in
                    Text(Risk.impactLabels[i] ?? "")
                        .font(.system(size: 9)).foregroundColor(.panelText3)
                        .frame(width: 52).multilineTextAlignment(.center)
                }
            }

            ForEach(probs, id: \.self) { p in
                HStack(spacing: 3) {
                    Text(Risk.probLabels[p] ?? "")
                        .font(.system(size: 9)).foregroundColor(.panelText2)
                        .frame(width: 56, alignment: .trailing)
                    ForEach(impacts, id: \.self) { i in
                        let score = (probValues[p] ?? 0.5) * (impactValues[i] ?? 0.5)
                        let count = allRisks.filter { $0.probability == p && $0.impact == i }.count
                        let bg = riskColor(score)

                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(bg.opacity(0.1))
                                .frame(width: 52, height: 52)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(bg.opacity(0.2), lineWidth: 1))
                            if count > 0 {
                                Text("\(count)")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(width: 24, height: 24)
                                    .background(bg)
                                    .clipShape(Circle())
                            }
                        }
                    }
                }
            }
        }
    }

    func legendDot(_ label: String, _ color: Color) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(.system(size: 11)).foregroundColor(.panelText2)
        }
    }

    func loadAllRisks() async {
        isLoading = true
        var risks: [Risk] = []
        let goals = (try? await APIService.shared.getGoals()) ?? []
        for g in goals {
            if let full = try? await APIService.shared.getGoal(g.id) {
                for var r in full.risks ?? [] {
                    r.goal_title = g.title
                    risks.append(r)
                }
            }
        }
        allRisks = risks
        isLoading = false
    }
}
