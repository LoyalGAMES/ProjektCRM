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
    let tabs = ["Przegląd", "SMART", "Kamienie", "Zadania", "Ryzyka", "Postęp"]

    var body: some View {
        ScrollView(showsIndicators: false) {
            if let g = goal {
                VStack(spacing: 0) {
                    heroSection(g)
                    Divider().padding(.horizontal, 24)
                    PanelTabPicker(selected: $selectedTab, labels: tabs)
                        .padding(.horizontal, 24)
                        .padding(.top, 12)
                    tabContent(g)
                        .padding(.horizontal, 24)
                        .padding(.top, 8)
                        .padding(.bottom, 32)
                }
            } else {
                ProgressView()
                    .tint(.accent)
                    .frame(maxWidth: .infinity)
                    .padding(80)
            }
        }
        .background(Color.panelBg)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button("Edytuj") { showEditForm = true }
                    Divider()
                    Button("Usuń", role: .destructive) { showDeleteConfirm = true }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.panelText2)
                        .frame(width: 36, height: 36)
                        .background(Color.panelCard)
                        .clipShape(Circle())
                }
            }
        }
        .sheet(isPresented: $showEditForm) { if let g = goal { GoalFormView(editGoal: g) } }
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
    func heroSection(_ g: Goal) -> some View {
        let cd = Countdown.from(g.target_date)
        return VStack(spacing: 16) {
            HStack(alignment: .top, spacing: 16) {
                GoalAvatar(goal: g, size: 56)

                VStack(alignment: .leading, spacing: 4) {
                    Text(g.title)
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .foregroundColor(.panelText)
                    Text(g.categoryEnum.label)
                        .font(.system(size: 13))
                        .foregroundColor(.panelText2)
                }

                Spacer()

                BadgeView(text: g.statusEnum.label, color: g.statusEnum.color, bgColor: g.statusEnum.bgColor)
            }

            if let desc = g.description, !desc.isEmpty {
                Text(desc)
                    .font(.system(size: 14))
                    .foregroundColor(.panelText2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .lineSpacing(3)
            }

            // Countdown
            HStack(spacing: 16) {
                VStack(spacing: 4) {
                    Text(cd.text)
                        .font(.system(size: 32, weight: .black, design: .rounded))
                        .foregroundColor(cd.overdue ? .dangerRed : .accent)
                    Text("do terminu")
                        .font(.system(size: 11))
                        .foregroundColor(.panelText3)
                }

                Spacer()

                VStack(spacing: 4) {
                    ProgressRing(value: g.progressValue, color: goalColor(for: g), size: 56)
                    Text("postęp")
                        .font(.system(size: 11))
                        .foregroundColor(.panelText3)
                }

                Spacer()

                VStack(spacing: 4) {
                    Text(formatDate(g.target_date))
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.panelText)
                    Text("termin")
                        .font(.system(size: 11))
                        .foregroundColor(.panelText3)
                }
            }
            .padding(16)
            .background(Color.panelCard)
            .cornerRadius(16)

            // Quick actions
            HStack(spacing: 8) {
                if g.status == "draft" {
                    actionBtn("Aktywuj", .infoBlue) { await store.updateGoal(g.id, data: ["status": "active"]) }
                }
                if g.status == "active" {
                    actionBtn("Wstrzymaj", .warningAmber) { await store.updateGoal(g.id, data: ["status": "paused"]) }
                    actionBtn("Ukończ", .successGreen) { await store.updateGoal(g.id, data: ["status": "completed", "progress": 100]) }
                }
                if g.status == "paused" {
                    actionBtn("Wznów", .infoBlue) { await store.updateGoal(g.id, data: ["status": "active"]) }
                }
            }
        }
        .padding(24)
    }

    func actionBtn(_ label: String, _ color: Color, action: @escaping () async -> Void) -> some View {
        Button { Task { await action() } } label: {
            Text(label)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(color)
                .padding(.horizontal, 18)
                .padding(.vertical, 10)
                .background(color.opacity(0.1))
                .cornerRadius(10)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(color.opacity(0.3), lineWidth: 1))
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

        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            StatCard(value: "\(Int(ss * 100))%", label: "SMART Score", color: ss >= 0.8 ? .successGreen : ss >= 0.6 ? .warningAmber : .dangerRed)
            StatCard(value: "\(mDone)/\((g.milestones ?? []).count)", label: "Kamienie milowe", color: .infoBlue)
            StatCard(value: "\(tDone)/\((g.tasks ?? []).count)", label: "Zadania", color: .goalPurple)
            StatCard(value: "\(highR)", label: "Wysokie ryzyka", color: highR > 0 ? .dangerRed : .successGreen)
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
            // Score card
            VStack(spacing: 10) {
                Text("Jakość celu SMART")
                    .font(.system(size: 13))
                    .foregroundColor(.panelText2)
                ProgressBar(value: ss * 100, color: ss >= 0.8 ? .successGreen : ss >= 0.6 ? .warningAmber : .dangerRed, height: 8)
                Text("\(Int(ss * 100))%")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundColor(.panelText)
                HStack(spacing: 6) {
                    ForEach(Array("SMART".enumerated()), id: \.offset) { i, ch in
                        Text(String(ch))
                            .font(.system(size: 14, weight: .heavy))
                            .frame(width: 32, height: 32)
                            .background(Double(i) < ss * 5 ? Color.accent : Color.panelCard)
                            .foregroundColor(Double(i) < ss * 5 ? .white : .panelText3)
                            .cornerRadius(8)
                    }
                }
            }
            .whiteCard()

            ForEach(fields, id: \.0) { letter, title, pl, value in
                let filled = (value ?? "").trimmingCharacters(in: .whitespaces).count > 10
                HStack(alignment: .top, spacing: 14) {
                    Text(letter)
                        .font(.system(size: 16, weight: .black))
                        .frame(width: 32, height: 32)
                        .background(filled ? Color.accent : Color.panelCard)
                        .foregroundColor(filled ? .white : .panelText3)
                        .cornerRadius(8)
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text(title).font(.system(size: 14, weight: .bold)).foregroundColor(.panelText)
                            Text("· \(pl)").font(.system(size: 12)).foregroundColor(.panelText3)
                        }
                        Text(value ?? "Nie zdefiniowano")
                            .font(.system(size: 13))
                            .foregroundColor(filled ? .panelText : .panelText3)
                            .lineSpacing(3)
                    }
                }
                .whiteCard(borderColor: filled ? Color.accent.opacity(0.3) : .panelBorder)
            }
        }
    }

    // MARK: - Milestones
    func milestonesTab(_ g: Goal) -> some View {
        VStack(spacing: 6) {
            AddButton(label: "Dodaj kamień milowy") { showAddMilestone = true }

            ForEach(g.milestones ?? []) { m in
                Button { Task { await store.toggleMilestone(m) } } label: {
                    HStack(spacing: 12) {
                        CircleCheck(checked: m.isDone, color: .successGreen)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(m.title)
                                .font(.system(size: 14, weight: .medium))
                                .strikethrough(m.isDone)
                                .foregroundColor(m.isDone ? .panelText3 : .panelText)
                            if let d = m.target_date {
                                Text(formatDate(d))
                                    .font(.system(size: 11))
                                    .foregroundColor(.panelText3)
                            }
                        }
                        Spacer()
                        if m.isDone {
                            BadgeView(text: "Gotowe", color: .successGreen, bgColor: .successBg)
                        }
                    }
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.panelBorder, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }

            if (g.milestones ?? []).isEmpty {
                EmptyStateView(title: "Brak kamieni milowych")
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

        return VStack(spacing: 6) {
            AddButton(label: "Dodaj zadanie") { showAddTask = true }

            ForEach(groups, id: \.0) { status, label, items in
                if !items.isEmpty {
                    HStack(spacing: 6) {
                        Circle().fill(taskStatusColor(status)).frame(width: 8, height: 8)
                        Text(label)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.panelText2)
                        Text("\(items.count)")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.panelText3)
                        Spacer()
                    }
                    .padding(.top, 8)

                    ForEach(items) { t in
                        Button { Task { await store.cycleTaskStatus(t) } } label: {
                            HStack(spacing: 12) {
                                CircleCheck(checked: t.isDone, color: .accent)
                                Text(t.title)
                                    .font(.system(size: 14, weight: .medium))
                                    .strikethrough(t.isDone)
                                    .foregroundColor(t.isDone ? .panelText3 : .panelText)
                                Spacer()
                                PriorityBadge(priority: t.priorityEnum)
                            }
                            .padding(14)
                            .background(Color.white)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.panelBorder, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            if tasks.isEmpty {
                EmptyStateView(title: "Brak zadań", subtitle: "Dodaj pierwsze zadanie")
            }
        }
    }

    func taskStatusColor(_ s: String) -> Color {
        switch s {
        case "in_progress": .infoBlue; case "done": .successGreen; default: .panelText3
        }
    }

    // MARK: - Risks
    func risksTab(_ g: Goal) -> some View {
        VStack(spacing: 6) {
            AddButton(label: "Dodaj ryzyko") { showAddRisk = true }

            ForEach((g.risks ?? []).sorted { $0.scoreValue > $1.scoreValue }) { r in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(r.title)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.panelText)
                        Spacer()
                        BadgeView(text: "\(Int(r.scoreValue * 100))%", color: riskColor(r.scoreValue))
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

            if (g.risks ?? []).isEmpty {
                EmptyStateView(title: "Brak ryzyk")
            }
        }
    }

    // MARK: - Progress
    func progressTab(_ g: Goal) -> some View {
        VStack(spacing: 6) {
            AddButton(label: "Dodaj wpis") { showAddProgress = true }

            ForEach(g.progressLogs ?? []) { l in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(formatDate(l.date))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.panelText2)
                        Spacer()
                        Text("\(Int(l.progress_value ?? 0))%")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundColor(.accent)
                    }
                    if let n = l.notes, !n.isEmpty {
                        Text(n).font(.system(size: 13)).foregroundColor(.panelText).lineSpacing(3)
                    }
                    if let a = l.achievements, !a.isEmpty {
                        HStack(spacing: 4) {
                            Circle().fill(Color.successGreen).frame(width: 6, height: 6)
                            Text(a).font(.system(size: 12)).foregroundColor(.successGreen)
                        }
                    }
                    if let o = l.obstacles, !o.isEmpty {
                        HStack(spacing: 4) {
                            Circle().fill(Color.warningAmber).frame(width: 6, height: 6)
                            Text(o).font(.system(size: 12)).foregroundColor(.warningAmber)
                        }
                    }
                }
                .whiteCard()
            }

            if (g.progressLogs ?? []).isEmpty {
                EmptyStateView(title: "Brak wpisów postępu")
            }
        }
    }
}

// MARK: - Sheets
struct AddMilestoneSheet: View {
    @EnvironmentObject var store: GoalStore
    @Environment(\.dismiss) var dismiss
    let goalId: String
    @State private var title = ""
    @State private var date = Date()
    @State private var hasDate = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                formField("Nazwa kamienia milowego", text: $title, placeholder: "np. Zakończyć moduł 1")
                Toggle("Dodaj termin", isOn: $hasDate).tint(.accent)
                if hasDate { DatePicker("Data", selection: $date, displayedComponents: .date).tint(.accent) }
                Spacer()
            }
            .padding(24)
            .navigationTitle("Nowy kamień milowy")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Dodaj") {
                        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
                        Task { await store.createMilestone(goalId: goalId, title: title, date: hasDate ? df.string(from: date) : nil); dismiss() }
                    }
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.accent)
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
            VStack(spacing: 20) {
                formField("Nazwa zadania", text: $title, placeholder: "np. Przeczytać rozdział 1")
                Picker("Priorytet", selection: $priority) {
                    ForEach(GoalPriority.allCases, id: \.self) { p in Text(p.label).tag(p) }
                }
                .pickerStyle(.segmented)
                Toggle("Dodaj termin", isOn: $hasDate).tint(.accent)
                if hasDate { DatePicker("Data", selection: $date, displayedComponents: .date).tint(.accent) }
                Spacer()
            }
            .padding(24)
            .navigationTitle("Nowe zadanie")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Dodaj") {
                        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
                        Task { await store.createTask(goalId: goalId, title: title, priority: priority.rawValue, dueDate: hasDate ? df.string(from: date) : nil); dismiss() }
                    }
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.accent)
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

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    formField("Nazwa ryzyka", text: $title, placeholder: "np. Brak czasu")
                    formFieldMulti("Opis", text: $desc, placeholder: "Szczegóły ryzyka...")
                    Picker("Prawdopodobieństwo", selection: $prob) {
                        ForEach(["very_low", "low", "medium", "high", "very_high"], id: \.self) {
                            Text(Risk.probLabels[$0] ?? $0).tag($0)
                        }
                    }
                    Picker("Wpływ", selection: $impact) {
                        ForEach(["negligible", "minor", "moderate", "major", "critical"], id: \.self) {
                            Text(Risk.impactLabels[$0] ?? $0).tag($0)
                        }
                    }
                    formFieldMulti("Plan mitygacji", text: $mitigation, placeholder: "Jak zmniejszyć ryzyko...")
                }
                .padding(24)
            }
            .navigationTitle("Nowe ryzyko")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Dodaj") {
                        Task { await store.createRisk(goalId: goalId, data: ["title": title, "description": desc, "probability": prob, "impact": impact, "mitigation_plan": mitigation]); dismiss() }
                    }
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.accent)
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
            ScrollView {
                VStack(spacing: 20) {
                    VStack(spacing: 8) {
                        Text("\(Int(value))%")
                            .font(.system(size: 36, weight: .black, design: .rounded))
                            .foregroundColor(.accent)
                        Slider(value: $value, in: 0...100, step: 5)
                            .tint(.accent)
                    }
                    formFieldMulti("Notatki", text: $notes, placeholder: "Co się wydarzyło?")
                    formFieldMulti("Osiągnięcia", text: $achievements, placeholder: "Co udało się zrobić?")
                    formFieldMulti("Przeszkody", text: $obstacles, placeholder: "Co stanowiło problem?")
                }
                .padding(24)
            }
            .navigationTitle("Wpis postępu")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Zapisz") {
                        Task { await store.addProgress(goalId: goalId, value: value, notes: notes, achievements: achievements, obstacles: obstacles); dismiss() }
                    }
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.accent)
                }
            }
            .onAppear { value = current }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Form helpers
func formField(_ label: String, text: Binding<String>, placeholder: String) -> some View {
    VStack(alignment: .leading, spacing: 6) {
        Text(label).font(.system(size: 12, weight: .semibold)).foregroundColor(.panelText2)
        TextField(placeholder, text: text)
            .font(.system(size: 15))
            .padding(14)
            .background(Color.panelCard)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.panelBorder))
    }
}

func formFieldMulti(_ label: String, text: Binding<String>, placeholder: String) -> some View {
    VStack(alignment: .leading, spacing: 6) {
        Text(label).font(.system(size: 12, weight: .semibold)).foregroundColor(.panelText2)
        TextField(placeholder, text: text, axis: .vertical)
            .lineLimit(3...6)
            .font(.system(size: 15))
            .padding(14)
            .background(Color.panelCard)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.panelBorder))
    }
}
