import SwiftUI

struct GoalsListView: View {
    @EnvironmentObject var store: GoalStore
    @State private var filterStatus: String? = nil
    @State private var sortBy = "deadline"
    @State private var showForm = false

    let filters: [(String?, String)] = [
        (nil, "Wszystkie"), ("active", "Aktywne"), ("draft", "Szkice"), ("completed", "Ukończone")
    ]
    let sorts: [(String, String)] = [
        ("deadline", "Termin"), ("priority", "Priorytet"), ("progress", "Postęp"), ("created", "Data dodania")
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Filters
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(filters, id: \.1) { key, label in
                                FilterChip(label: label, isActive: filterStatus == key) {
                                    filterStatus = key
                                    Task { await store.loadGoals(status: filterStatus, sort: sortBy) }
                                }
                            }
                        }
                    }

                    // Sort
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 4) {
                            ForEach(sorts, id: \.0) { key, label in
                                SortChip(label: label, isActive: sortBy == key) {
                                    sortBy = key
                                    Task { await store.loadGoals(status: filterStatus, sort: sortBy) }
                                }
                            }
                        }
                    }

                    // Goals Grid
                    if store.goals.isEmpty {
                        EmptyStateView(icon: "target", title: "Brak celów", subtitle: "Dodaj swój pierwszy cel SMART")
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(store.goals) { goal in
                                NavigationLink(value: goal.id) {
                                    GoalCard(goal: goal)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color.bg)
            .navigationTitle("Cele")
            .navigationDestination(for: String.self) { id in
                GoalDetailView(goalId: id)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showForm = true } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .sheet(isPresented: $showForm) {
                GoalFormView()
            }
            .refreshable { await store.loadGoals(status: filterStatus, sort: sortBy) }
            .task { await store.loadGoals(status: filterStatus, sort: sortBy) }
        }
    }
}

// MARK: - Goal Card
struct GoalCard: View {
    let goal: Goal

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                CategoryIcon(category: goal.categoryEnum, size: 28)
                Spacer()
                BadgeView(text: goal.statusEnum.label, color: goal.statusEnum.color)
            }

            Text(goal.title)
                .font(.system(size: 16, weight: .bold))
                .lineLimit(2)
                .frame(minHeight: 40, alignment: .topLeading)

            if let desc = goal.description, !desc.isEmpty {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(.text2)
                    .lineLimit(2)
            }

            HStack(spacing: 8) {
                ProgressBar(value: goal.progressValue, color: goal.statusEnum.color)
                Text("\(Int(goal.progressValue))%")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.text2)
            }

            HStack {
                PriorityBadge(priority: goal.priorityEnum)
                Spacer()
                CountdownBadge(targetDate: goal.target_date)
            }

            SMARTMini(score: goal.smartScore)
        }
        .cardStyle()
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let label: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: isActive ? .semibold : .regular))
                .foregroundColor(isActive ? .white : .text2)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isActive ? Color.primary : Color.card)
                .cornerRadius(20)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(isActive ? Color.primary : Color.border, lineWidth: 1))
        }
    }
}

struct SortChip: View {
    let label: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 14, weight: isActive ? .bold : .medium))
                .foregroundColor(isActive ? .primary : .text3)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .overlay(alignment: .bottom) {
                    if isActive {
                        Rectangle().fill(Color.primary).frame(height: 3).cornerRadius(1.5)
                    }
                }
        }
    }
}
