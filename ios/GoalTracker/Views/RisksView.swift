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
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if isLoading {
                        ProgressView().frame(maxWidth: .infinity).padding(60)
                    } else {
                        // Matrix
                        SectionHeader(title: "Macierz Ryzyk")
                        Text("Prawdopodobieństwo vs Wpływ")
                            .font(.caption).foregroundColor(.text2)

                        ScrollView(.horizontal, showsIndicators: false) {
                            matrixGrid
                        }

                        // Legend
                        HStack(spacing: 16) {
                            legendItem("Niskie", Color(hex: "22C55E"))
                            legendItem("Średnie", Color(hex: "EAB308"))
                            legendItem("Wysokie", Color(hex: "F97316"))
                            legendItem("Krytyczne", Color(hex: "EF4444"))
                        }
                        .frame(maxWidth: .infinity)

                        // Stats
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            StatCard(value: "\(allRisks.filter { $0.scoreValue >= 0.5 }.count)", label: "Krytyczne", color: Color(hex: "EF4444"))
                            StatCard(value: "\(allRisks.filter { $0.scoreValue >= 0.3 && $0.scoreValue < 0.5 }.count)", label: "Wysokie", color: Color(hex: "F97316"))
                            StatCard(value: "\(allRisks.filter { $0.scoreValue >= 0.15 && $0.scoreValue < 0.3 }.count)", label: "Średnie", color: Color(hex: "EAB308"))
                            StatCard(value: "\(allRisks.filter { $0.scoreValue < 0.15 }.count)", label: "Niskie", color: Color(hex: "22C55E"))
                        }

                        // Risk List
                        SectionHeader(title: "Lista Ryzyk")

                        if allRisks.isEmpty {
                            EmptyStateView(icon: "shield.fill", title: "Brak ryzyk")
                        }

                        ForEach(allRisks.sorted { $0.scoreValue > $1.scoreValue }) { r in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text(r.title).font(.system(size: 15, weight: .bold))
                                    Spacer()
                                    BadgeView(text: "\(Int(r.scoreValue * 100))%", color: riskColor(r.scoreValue))
                                }
                                if let gt = r.goal_title { Text(gt).font(.caption).foregroundColor(.text3) }
                                if let d = r.description, !d.isEmpty { Text(d).font(.caption).foregroundColor(.text2) }
                                HStack(spacing: 6) {
                                    BadgeView(text: "P: \(Risk.probLabels[r.probability ?? ""] ?? "")", color: .text2)
                                    BadgeView(text: "I: \(Risk.impactLabels[r.impact ?? ""] ?? "")", color: .text2)
                                }
                                if let m = r.mitigation_plan, !m.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Plan mitygacji").font(.system(size: 11, weight: .bold)).foregroundColor(.text2)
                                        Text(m).font(.caption)
                                    }
                                    .padding(10).background(Color.surfaceHL).cornerRadius(8)
                                }
                            }
                            .cardStyle()
                            .overlay(alignment: .leading) {
                                Rectangle().fill(riskColor(r.scoreValue)).frame(width: 4).cornerRadius(2)
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color.bg)
            .navigationTitle("Ryzyka")
            .task { await loadAllRisks() }
            .refreshable { await loadAllRisks() }
        }
    }

    // MARK: - Matrix Grid
    var matrixGrid: some View {
        VStack(spacing: 3) {
            // Header
            HStack(spacing: 3) {
                Text("").frame(width: 60)
                ForEach(impacts, id: \.self) { i in
                    Text(Risk.impactLabels[i] ?? "")
                        .font(.system(size: 9)).foregroundColor(.text3)
                        .frame(width: 56).multilineTextAlignment(.center)
                }
            }

            ForEach(probs, id: \.self) { p in
                HStack(spacing: 3) {
                    Text(Risk.probLabels[p] ?? "")
                        .font(.system(size: 10)).foregroundColor(.text2)
                        .frame(width: 60, alignment: .trailing)

                    ForEach(impacts, id: \.self) { i in
                        let score = (probValues[p] ?? 0.5) * (impactValues[i] ?? 0.5)
                        let count = allRisks.filter { $0.probability == p && $0.impact == i }.count
                        let bg = riskColor(score)

                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(bg.opacity(0.2))
                                .frame(width: 56, height: 56)
                            if count > 0 {
                                Text("\(count)")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(width: 26, height: 26)
                                    .background(bg)
                                    .clipShape(Circle())
                            }
                        }
                    }
                }
            }
        }
    }

    func legendItem(_ label: String, _ color: Color) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 3).fill(color).frame(width: 12, height: 12)
            Text(label).font(.caption).foregroundColor(.text2)
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
