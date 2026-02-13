import SwiftUI

struct GoalDetailView: View {
    @EnvironmentObject var store: GoalStore
    @Environment(\.dismiss) var dismiss
    let goalId: String
    @State private var selectedTab = 0
    @State private var showEditForm = false
    @State private var showAddMilestone = false
    @State private var showAddTask = false
    @State private var showAddRisk = false
    @State private var showAddProgress = false
    @State private var showDeleteConfirm = false

    var goal: Goal? { store.currentGoal }

    var body: some View {
        ScrollView {
            if let g = goal {
                VStack(spacing: 16) {
                    heroCard(g)
                    tabPicker
                    tabContent(g)
                }
                .padding()
            } else {
                ProgressView().padding(60)
            }
        }
        .background(Color.bg)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button("Edytuj") { showEditForm = true }
                    Divider()
                    Button("Usuń", role: .destructive) { showDeleteConfirm = true }
                } label: { Image(systemName: "ellipsis.circle") }
            }
        }
        .sheet(isPresented: $showEditForm) {
            if let g = goal { GoalFormView(editGoal: g) }
        }
        .sheet(isPresented: $showAddMilestone) { AddMilestoneSheet(goalId: goalId) }
        .sheet(isPresented: $showAddTask) { AddTaskSheet(goalId: goalId) }
        .sheet(isPresented: $showAddRisk) { AddRiskSheet(goalId: goalId) }
        .sheet(isPresented: $showAddProgress) { AddProgressSheet(goalId: goalId, current: goal?.progressValue ?? 0) }
        .alert("Usunąć cel?", isPresented: $showDeleteConfirm) {
            Button("Usuń", role: .destructive) { Task { await store.deleteGoal(goalId); dismiss() } }
            Button("Anuluj", role: .cancel) {}
        }
        .task { await store.loadGoal(goalId) }
    }

    // MARK: - Hero
    func heroCard(_ g: Goal) -> some View {
        let cd = Countdown.from(g.target_date)
        return VStack(spacing: 12) {
            HStack(alignment: .top) {
                CategoryIcon(category: g.categoryEnum, size: 44)
                VStack(alignment: .leading, spacing: 2) {
                    Text(g.title).font(.system(size: 22, weight: .heavy))
                    Text(g.categoryEnum.label).font(.caption).foregroundColor(.text2)
                }
                Spacer()
                BadgeView(text: g.statusEnum.label, color: g.statusEnum.color)
            }

            if let desc = g.description, !desc.isEmpty {
                Text(desc).font(.subheadline).foregroundColor(.text2).frame(maxWidth: .infinity, alignment: .leading)
            }

            Text(cd.text)
                .font(.system(size: 36, weight: .black, design: .rounded))
                .foregroundColor(cd.overdue ? .danger : .primary)
            Text("do terminu (\(formatDate(g.target_date)))")
                .font(.caption).foregroundColor(.text3)

            HStack(spacing: 12) {
                ProgressBar(value: g.progressValue, color: g.statusEnum.color, height: 10)
                Text("\(Int(g.progressValue))%")
                    .font(.system(size: 18, weight: .heavy))
            }

            // Quick actions
            HStack(spacing: 8) {
                if g.status == "draft" {
                    actionBtn("Aktywuj", .primary) { await store.updateGoal(g.id, data: ["status": "active"]) }
                }
                if g.status == "active" {
                    actionBtn("Wstrzymaj", .warning) { await store.updateGoal(g.id, data: ["status": "paused"]) }
                    actionBtn("Ukończ", .success) { await store.updateGoal(g.id, data: ["status": "completed", "progress": 100]) }
                }
                if g.status == "paused" {
                    actionBtn("Wznów", .primary) { await store.updateGoal(g.id, data: ["status": "active"]) }
                }
            }
        }
        .cardStyle()
        .overlay(alignment: .leading) {
            Rectangle().fill(Color(hex: g.color ?? "4A90D9")).frame(width: 5).cornerRadius(3)
        }
    }

    func actionBtn(_ label: String, _ color: Color, action: @escaping () async -> Void) -> some View {
        Button { Task { await action() } } label: {
            Text(label).font(.system(size: 13, weight: .bold))
                .foregroundColor(.white).padding(.horizontal, 16).padding(.vertical, 10)
                .background(color).cornerRadius(10)
        }
    }

    // MARK: - Tab Picker
    var tabPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(Array(["Przegląd", "SMART", "Kamienie", "Zadania", "Ryzyka", "Postęp"].enumerated()), id: \.offset) { i, label in
                    SortChip(label: label, isActive: selectedTab == i) { selectedTab = i }
                }
            }
        }
    }

    // MARK: - Tab Content
    @ViewBuilder
    func tabContent(_ g: Goal) -> some View {
        switch selectedTab {
        case 0: overviewTab(g)
        case 1: smartTab(g)
        case 2: milestonesTab(g)
        case 3: tasksTab(g)
        case 4: risksTab(g)
        case 5: progressTab(g)
        default: EmptyView()
        }
    }

    // MARK: - Overview
    func overviewTab(_ g: Goal) -> some View {
        let mDone = (g.milestones ?? []).filter(\.isDone).count
        let tDone = (g.tasks ?? []).filter(\.isDone).count
        let highR = (g.risks ?? []).filter { $0.scoreValue >= 0.6 }.count
        let ss = g.smartScore

        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(value: "\(Int(ss * 100))%", label: "SMART Score", color: ss >= 0.8 ? .success : ss >= 0.6 ? .warning : .danger)
            StatCard(value: "\(mDone)/\((g.milestones ?? []).count)", label: "Kamienie milowe", color: .primary)
            StatCard(value: "\(tDone)/\((g.tasks ?? []).count)", label: "Zadania", color: .secondary)
            StatCard(value: "\(highR)", label: "Wysokie ryzyka", color: highR > 0 ? .danger : .success)
        }
    }

    // MARK: - SMART
    func smartTab(_ g: Goal) -> some View {
        let ss = g.smartScore
        let fields: [(String, String, String, String?)] = [
            ("S", "Specific", "Konkretny", g.smart_specific),
            ("M", "Measurable", "Mierzalny", g.smart_measurable),
            ("A", "Achievable", "Osiągalny", g.smart_achievable),
            ("R", "Relevant", "Istotny", g.smart_relevant),
            ("T", "Time-bound", "Określony w czasie", g.smart_time_bound),
        ]

        return VStack(spacing: 12) {
            VStack(spacing: 8) {
                Text("Jakość celu SMART").font(.subheadline).foregroundColor(.text2)
                ProgressBar(value: ss * 100, color: ss >= 0.8 ? .success : ss >= 0.6 ? .warning : .danger, height: 10)
                Text("\(Int(ss * 100))%").font(.system(size: 28, weight: .black, design: .rounded))
                HStack(spacing: 8) {
                    ForEach(Array("SMART".enumerated()), id: \.offset) { i, ch in
                        Text(String(ch))
                            .font(.system(size: 16, weight: .heavy))
                            .frame(width: 36, height: 36)
                            .background(Double(i) < ss * 5 ? Color.primary : Color.surfaceHL)
                            .foregroundColor(Double(i) < ss * 5 ? .white : .text3)
                            .cornerRadius(10)
                    }
                }
            }
            .cardStyle()

            ForEach(fields, id: \.0) { letter, title, pl, value in
                let filled = (value ?? "").trimmingCharacters(in: .whitespaces).count > 10
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 12) {
                        Text(letter)
                            .font(.system(size: 18, weight: .black))
                            .frame(width: 36, height: 36)
                            .background(filled ? Color.primary : Color.surfaceHL)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        VStack(alignment: .leading) {
                            Text(title).font(.system(size: 15, weight: .bold))
                            Text(pl).font(.caption).foregroundColor(.text2)
                        }
                    }
                    Text(value ?? "Nie zdefiniowano")
                        .font(.subheadline)
                        .foregroundColor(filled ? .white : .text3)
                }
                .cardStyle(borderColor: filled ? Color.primary.opacity(0.3) : nil)
            }
        }
    }

    // MARK: - Milestones
    func milestonesTab(_ g: Goal) -> some View {
        VStack(spacing: 8) {
            Button { showAddMilestone = true } label: {
                Label("Dodaj kamień milowy", systemImage: "plus.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 4)

            ForEach(g.milestones ?? []) { m in
                HStack(spacing: 12) {
                    Button { Task { await store.toggleMilestone(m) } } label: {
                        Image(systemName: m.isDone ? "checkmark.circle.fill" : "circle")
                            .font(.title2)
                            .foregroundColor(m.isDone ? .success : .text3)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(m.title)
                            .font(.system(size: 15, weight: .semibold))
                            .strikethrough(m.isDone)
                            .foregroundColor(m.isDone ? .text3 : .white)
                        if let d = m.target_date { Text(formatDate(d)).font(.caption).foregroundColor(.text2) }
                    }
                    Spacer()
                }
                .cardStyle()
            }

            if (g.milestones ?? []).isEmpty {
                EmptyStateView(icon: "flag", title: "Brak kamieni milowych")
            }
        }
    }

    // MARK: - Tasks
    func tasksTab(_ g: Goal) -> some View {
        let tasks = g.tasks ?? []
        let groups: [(String, String, [GoalTask])] = [
            ("todo", "Do zrobienia", tasks.filter { $0.status == "todo" }),
            ("in_progress", "W trakcie", tasks.filter { $0.status == "in_progress" }),
            ("done", "Gotowe", tasks.filter { $0.status == "done" }),
        ]

        return VStack(spacing: 8) {
            Button { showAddTask = true } label: {
                Label("Dodaj zadanie", systemImage: "plus.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 4)

            ForEach(groups, id: \.0) { _, label, items in
                Text("\(label) (\(items.count))").font(.system(size: 14, weight: .bold)).foregroundColor(.text2)
                    .frame(maxWidth: .infinity, alignment: .leading).padding(.top, 4)

                ForEach(items) { t in
                    Button { Task { await store.cycleTaskStatus(t) } } label: {
                        HStack(spacing: 12) {
                            RoundedRectangle(cornerRadius: 2).fill(statusColor(t.status)).frame(width: 4, height: 30)
                            Text(t.title)
                                .font(.system(size: 14))
                                .strikethrough(t.isDone)
                                .foregroundColor(t.isDone ? .text3 : .white)
                            Spacer()
                            PriorityBadge(priority: t.priorityEnum)
                        }
                        .cardStyle()
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    func statusColor(_ status: String?) -> Color {
        switch status {
        case "in_progress": .primary; case "done": .success; default: .text3
        }
    }

    // MARK: - Risks
    func risksTab(_ g: Goal) -> some View {
        VStack(spacing: 8) {
            Button { showAddRisk = true } label: {
                Label("Dodaj ryzyko", systemImage: "plus.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 4)

            ForEach((g.risks ?? []).sorted { $0.scoreValue > $1.scoreValue }) { r in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(r.title).font(.system(size: 15, weight: .bold))
                        Spacer()
                        BadgeView(text: "\(Int(r.scoreValue * 100))%", color: riskColor(r.scoreValue))
                    }
                    if let d = r.description, !d.isEmpty { Text(d).font(.caption).foregroundColor(.text2) }
                    HStack(spacing: 6) {
                        BadgeView(text: "P: \(Risk.probLabels[r.probability ?? ""] ?? "")", color: .text2)
                        BadgeView(text: "I: \(Risk.impactLabels[r.impact ?? ""] ?? "")", color: .text2)
                    }
                    if let m = r.mitigation_plan, !m.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Plan mitygacji").font(.system(size: 11, weight: .bold)).foregroundColor(.text2)
                            Text(m).font(.caption).foregroundColor(.white)
                        }
                        .padding(10).background(Color.surfaceHL).cornerRadius(8)
                    }
                }
                .cardStyle()
                .overlay(alignment: .leading) {
                    Rectangle().fill(riskColor(r.scoreValue)).frame(width: 4).cornerRadius(2)
                }
            }

            if (g.risks ?? []).isEmpty {
                EmptyStateView(icon: "shield", title: "Brak ryzyk")
            }
        }
    }

    // MARK: - Progress
    func progressTab(_ g: Goal) -> some View {
        VStack(spacing: 8) {
            Button { showAddProgress = true } label: {
                Label("Dodaj wpis postępu", systemImage: "plus.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 4)

            ForEach(g.progressLogs ?? []) { l in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(formatDate(l.date)).font(.system(size: 13, weight: .semibold)).foregroundColor(.text2)
                        Spacer()
                        Text("\(Int(l.progress_value ?? 0))%").font(.system(size: 15, weight: .bold)).foregroundColor(.primary)
                    }
                    if let n = l.notes, !n.isEmpty { Text(n).font(.subheadline) }
                    if let a = l.achievements, !a.isEmpty { Label(a, systemImage: "star.fill").font(.caption).foregroundColor(.success) }
                    if let o = l.obstacles, !o.isEmpty { Label(o, systemImage: "exclamationmark.triangle.fill").font(.caption).foregroundColor(.warning) }
                }
                .cardStyle()
            }

            if (g.progressLogs ?? []).isEmpty {
                EmptyStateView(icon: "chart.line.uptrend.xyaxis", title: "Brak wpisów")
            }
        }
    }
}

// MARK: - Add Sheets
struct AddMilestoneSheet: View {
    @EnvironmentObject var store: GoalStore
    @Environment(\.dismiss) var dismiss
    let goalId: String
    @State private var title = ""
    @State private var date = Date()
    @State private var hasDate = false

    var body: some View {
        NavigationStack {
            Form {
                TextField("Nazwa", text: $title)
                Toggle("Termin", isOn: $hasDate)
                if hasDate { DatePicker("Data", selection: $date, displayedComponents: .date) }
            }
            .navigationTitle("Nowy kamień milowy")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Dodaj") {
                        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
                        Task { await store.createMilestone(goalId: goalId, title: title, date: hasDate ? df.string(from: date) : nil); dismiss() }
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

struct AddTaskSheet: View {
    @EnvironmentObject var store: GoalStore
    @Environment(\.dismiss) var dismiss
    let goalId: String
    @State private var title = ""
    @State private var priority: GoalPriority = .medium
    @State private var date = Date()
    @State private var hasDate = false

    var body: some View {
        NavigationStack {
            Form {
                TextField("Nazwa", text: $title)
                Picker("Priorytet", selection: $priority) {
                    ForEach(GoalPriority.allCases, id: \.self) { p in Text(p.label).tag(p) }
                }
                Toggle("Termin", isOn: $hasDate)
                if hasDate { DatePicker("Data", selection: $date, displayedComponents: .date) }
            }
            .navigationTitle("Nowe zadanie")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Dodaj") {
                        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
                        Task { await store.createTask(goalId: goalId, title: title, priority: priority.rawValue, dueDate: hasDate ? df.string(from: date) : nil); dismiss() }
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

struct AddRiskSheet: View {
    @EnvironmentObject var store: GoalStore
    @Environment(\.dismiss) var dismiss
    let goalId: String
    @State private var title = ""
    @State private var desc = ""
    @State private var prob = "medium"
    @State private var impact = "moderate"
    @State private var mitigation = ""

    let probs = ["very_low", "low", "medium", "high", "very_high"]
    let impacts = ["negligible", "minor", "moderate", "major", "critical"]

    var body: some View {
        NavigationStack {
            Form {
                TextField("Nazwa", text: $title)
                TextField("Opis", text: $desc, axis: .vertical).lineLimit(3)
                Picker("Prawdopodobieństwo", selection: $prob) {
                    ForEach(probs, id: \.self) { Text(Risk.probLabels[$0] ?? $0).tag($0) }
                }
                Picker("Wpływ", selection: $impact) {
                    ForEach(impacts, id: \.self) { Text(Risk.impactLabels[$0] ?? $0).tag($0) }
                }
                TextField("Plan mitygacji", text: $mitigation, axis: .vertical).lineLimit(3)
            }
            .navigationTitle("Nowe ryzyko")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Dodaj") {
                        Task { await store.createRisk(goalId: goalId, data: ["title": title, "description": desc, "probability": prob, "impact": impact, "mitigation_plan": mitigation]); dismiss() }
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
        .presentationDetents([.large])
    }
}

struct AddProgressSheet: View {
    @EnvironmentObject var store: GoalStore
    @Environment(\.dismiss) var dismiss
    let goalId: String
    let current: Double
    @State private var value: Double = 0
    @State private var notes = ""
    @State private var achievements = ""
    @State private var obstacles = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Postęp") {
                    Slider(value: $value, in: 0...100, step: 5)
                    Text("\(Int(value))%").font(.title2.bold()).foregroundColor(.primary)
                }
                Section("Notatki") {
                    TextField("Co się wydarzyło?", text: $notes, axis: .vertical).lineLimit(3)
                    TextField("Osiągnięcia", text: $achievements, axis: .vertical).lineLimit(2)
                    TextField("Przeszkody", text: $obstacles, axis: .vertical).lineLimit(2)
                }
            }
            .navigationTitle("Wpis postępu")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Zapisz") {
                        Task { await store.addProgress(goalId: goalId, value: value, notes: notes, achievements: achievements, obstacles: obstacles); dismiss() }
                    }
                }
            }
            .onAppear { value = current }
        }
        .presentationDetents([.medium])
    }
}
