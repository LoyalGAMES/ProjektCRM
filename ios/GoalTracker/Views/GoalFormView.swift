import SwiftUI

struct GoalFormView: View {
    @EnvironmentObject var store: GoalStore
    @Environment(\.dismiss) var dismiss
    var editGoal: Goal? = nil

    @State private var step = 0
    @State private var form = GoalFormData()

    var isEditing: Bool { editGoal != nil }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Step indicator
                    HStack(spacing: 0) {
                        stepButton("1. Podstawy", active: step == 0) { step = 0 }
                        Rectangle().fill(Color.border).frame(height: 2).frame(width: 40)
                        stepButton("2. SMART", active: step == 1) { step = 1 }
                    }
                    .padding(.bottom, 8)

                    if step == 0 { basicsStep }
                    else { smartStep }
                }
                .padding()
            }
            .background(Color.bg)
            .navigationTitle(isEditing ? "Edytuj cel" : "Nowy cel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anuluj") { dismiss() } }
            }
            .onAppear {
                if let g = editGoal { form.load(from: g) }
            }
        }
    }

    func stepButton(_ label: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 14, weight: active ? .bold : .medium))
                .foregroundColor(active ? .white : .text2)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(active ? Color.primary : Color.card)
                .cornerRadius(12)
        }
    }

    // MARK: - Basics Step
    var basicsStep: some View {
        VStack(spacing: 16) {
            formField("Nazwa celu") {
                TextField("np. Nauczyć się hiszpańskiego na B2", text: $form.title)
                    .textFieldStyle(.plain)
                    .padding(14)
                    .background(Color.card)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.border))
            }

            formField("Opis") {
                TextField("Szczegółowy opis celu...", text: $form.description, axis: .vertical)
                    .lineLimit(3...6)
                    .textFieldStyle(.plain)
                    .padding(14)
                    .background(Color.card)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.border))
            }

            formField("Kategoria") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 8) {
                    ForEach(GoalCategory.allCases, id: \.self) { cat in
                        Button {
                            form.category = cat
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: cat.icon).font(.caption)
                                Text(cat.label).font(.system(size: 13))
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(form.category == cat ? cat.color.opacity(0.2) : Color.card)
                            .foregroundColor(form.category == cat ? cat.color : .text2)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(form.category == cat ? cat.color : Color.border))
                        }
                    }
                }
            }

            formField("Priorytet") {
                HStack(spacing: 8) {
                    ForEach(GoalPriority.allCases, id: \.self) { p in
                        Button {
                            form.priority = p
                        } label: {
                            VStack(spacing: 4) {
                                Circle().fill(p.color).frame(width: 12, height: 12)
                                Text(p.label).font(.system(size: 12))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(form.priority == p ? p.color.opacity(0.15) : Color.card)
                            .foregroundColor(form.priority == p ? p.color : .text2)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(form.priority == p ? p.color : Color.border, lineWidth: form.priority == p ? 2 : 1))
                        }
                    }
                }
            }

            HStack(spacing: 12) {
                formField("Data rozpoczęcia") {
                    DatePicker("", selection: $form.startDate, displayedComponents: .date)
                        .labelsHidden()
                        .frame(maxWidth: .infinity)
                }
                formField("Termin realizacji") {
                    DatePicker("", selection: $form.targetDate, displayedComponents: .date)
                        .labelsHidden()
                        .frame(maxWidth: .infinity)
                }
            }

            Button { step = 1 } label: {
                Text("Dalej: Zdefiniuj SMART →")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(14)
                    .background(Color.primary)
                    .cornerRadius(12)
            }
        }
    }

    // MARK: - SMART Step
    var smartStep: some View {
        let ss = form.smartScore
        let fields: [(String, String, String, WritableKeyPath<GoalFormData, String>)] = [
            ("S", "Specific - Konkretny", "Co dokładnie chcesz osiągnąć?", \.smartSpecific),
            ("M", "Measurable - Mierzalny", "Jak zmierzysz postęp?", \.smartMeasurable),
            ("A", "Achievable - Osiągalny", "Czy cel jest realistyczny?", \.smartAchievable),
            ("R", "Relevant - Istotny", "Dlaczego ten cel jest ważny?", \.smartRelevant),
            ("T", "Time-bound - Określony w czasie", "Jaki jest Twój termin?", \.smartTimeBound),
        ]

        return VStack(spacing: 16) {
            // Score
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

            ForEach(fields, id: \.0) { letter, title, prompt, keyPath in
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 10) {
                        let filled = form[keyPath: keyPath].trimmingCharacters(in: .whitespaces).count > 10
                        Text(letter)
                            .font(.system(size: 16, weight: .black))
                            .frame(width: 28, height: 28)
                            .background(filled ? Color.primary : Color.surfaceHL)
                            .foregroundColor(.white)
                            .cornerRadius(7)
                        Text(title).font(.system(size: 14, weight: .bold))
                    }
                    Text(prompt).font(.caption).foregroundColor(.text3).italic()
                    TextField("", text: Binding(get: { form[keyPath: keyPath] }, set: { form[keyPath: keyPath] = $0 }), axis: .vertical)
                        .lineLimit(3...6)
                        .textFieldStyle(.plain)
                        .padding(14)
                        .background(Color.card)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.border))
                }
            }

            HStack(spacing: 12) {
                Button { step = 0 } label: {
                    Text("← Wstecz")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.text2)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Color.card)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.border))
                }

                Button { save() } label: {
                    Text(isEditing ? "Zapisz zmiany" : "Utwórz cel")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(form.title.isEmpty ? Color.text3 : Color.primary)
                        .cornerRadius(12)
                }
                .disabled(form.title.isEmpty)
            }
        }
    }

    func formField<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.system(size: 13, weight: .semibold)).foregroundColor(.text2)
            content()
        }
    }

    func save() {
        Task {
            if let g = editGoal {
                await store.updateGoal(g.id, data: form.payload)
            } else {
                _ = await store.createGoal(form.payload)
            }
            dismiss()
        }
    }
}
