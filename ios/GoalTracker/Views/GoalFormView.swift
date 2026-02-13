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
                VStack(spacing: 24) {
                    // Step indicator
                    HStack(spacing: 12) {
                        stepDot(0, "Podstawy")
                        Rectangle().fill(step >= 1 ? Color.accent : Color.panelBorder).frame(height: 2).frame(maxWidth: 60)
                        stepDot(1, "SMART")
                    }
                    .padding(.bottom, 4)

                    if step == 0 { basicsStep }
                    else { smartStep }
                }
                .padding(24)
            }
            .background(Color.panelBg)
            .navigationTitle(isEditing ? "Edytuj cel" : "Nowy cel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Anuluj") { dismiss() }
                        .foregroundColor(.panelText2)
                }
            }
            .onAppear { if let g = editGoal { form.load(from: g) } }
        }
    }

    func stepDot(_ idx: Int, _ label: String) -> some View {
        Button { step = idx } label: {
            HStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(step >= idx ? Color.accent : Color.panelCard)
                        .frame(width: 28, height: 28)
                    Text("\(idx + 1)")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(step >= idx ? .white : .panelText3)
                }
                Text(label)
                    .font(.system(size: 13, weight: step == idx ? .bold : .medium))
                    .foregroundColor(step == idx ? .panelText : .panelText3)
            }
        }
    }

    // MARK: - Basics
    var basicsStep: some View {
        VStack(spacing: 18) {
            formField("Nazwa celu", text: $form.title, placeholder: "np. Nauczyć się hiszpańskiego na B2")

            VStack(alignment: .leading, spacing: 6) {
                Text("Opis").font(.system(size: 12, weight: .semibold)).foregroundColor(.panelText2)
                TextField("Szczegółowy opis celu...", text: $form.description, axis: .vertical)
                    .lineLimit(3...6)
                    .font(.system(size: 15))
                    .padding(14)
                    .background(Color.panelCard)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.panelBorder))
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Kategoria").font(.system(size: 12, weight: .semibold)).foregroundColor(.panelText2)
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 90))], spacing: 8) {
                    ForEach(GoalCategory.allCases, id: \.self) { cat in
                        Button { form.category = cat } label: {
                            VStack(spacing: 6) {
                                ZStack {
                                    Circle()
                                        .fill(
                                            form.category == cat
                                                ? LinearGradient(colors: cat.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                                                : LinearGradient(colors: [Color.panelCard, Color.panelCard], startPoint: .top, endPoint: .bottom)
                                        )
                                        .frame(width: 36, height: 36)
                                    Text(cat.initials)
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(form.category == cat ? .white : .panelText3)
                                }
                                Text(cat.label)
                                    .font(.system(size: 11))
                                    .foregroundColor(form.category == cat ? .panelText : .panelText3)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(form.category == cat ? cat.color.opacity(0.08) : Color.white)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(form.category == cat ? cat.color.opacity(0.4) : Color.panelBorder))
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Priorytet").font(.system(size: 12, weight: .semibold)).foregroundColor(.panelText2)
                HStack(spacing: 8) {
                    ForEach(GoalPriority.allCases, id: \.self) { p in
                        Button { form.priority = p } label: {
                            VStack(spacing: 5) {
                                Circle().fill(p.color).frame(width: 10, height: 10)
                                Text(p.label).font(.system(size: 11, weight: .medium))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(form.priority == p ? p.bgColor : Color.white)
                            .foregroundColor(form.priority == p ? p.color : .panelText3)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(form.priority == p ? p.color.opacity(0.4) : Color.panelBorder))
                        }
                    }
                }
            }

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Start").font(.system(size: 12, weight: .semibold)).foregroundColor(.panelText2)
                    DatePicker("", selection: $form.startDate, displayedComponents: .date)
                        .labelsHidden().tint(.accent)
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("Termin").font(.system(size: 12, weight: .semibold)).foregroundColor(.panelText2)
                    DatePicker("", selection: $form.targetDate, displayedComponents: .date)
                        .labelsHidden().tint(.accent)
                }
            }

            Button { step = 1 } label: {
                Text("Dalej: Zdefiniuj SMART")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(14)
                    .background(Color.accent)
                    .cornerRadius(12)
            }
        }
    }

    // MARK: - SMART
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
            VStack(spacing: 8) {
                Text("Jakość celu SMART")
                    .font(.system(size: 13)).foregroundColor(.panelText2)
                ProgressBar(value: ss * 100, color: ss >= 0.8 ? .successGreen : ss >= 0.6 ? .warningAmber : .dangerRed, height: 8)
                Text("\(Int(ss * 100))%")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundColor(.panelText)
                HStack(spacing: 6) {
                    ForEach(Array("SMART".enumerated()), id: \.offset) { i, ch in
                        Text(String(ch))
                            .font(.system(size: 14, weight: .heavy))
                            .frame(width: 30, height: 30)
                            .background(Double(i) < ss * 5 ? Color.accent : Color.panelCard)
                            .foregroundColor(Double(i) < ss * 5 ? .white : .panelText3)
                            .cornerRadius(8)
                    }
                }
            }
            .whiteCard()

            ForEach(fields, id: \.0) { letter, title, prompt, keyPath in
                let filled = form[keyPath: keyPath].trimmingCharacters(in: .whitespaces).count > 10
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 10) {
                        Text(letter)
                            .font(.system(size: 14, weight: .black))
                            .frame(width: 26, height: 26)
                            .background(filled ? Color.accent : Color.panelCard)
                            .foregroundColor(filled ? .white : .panelText3)
                            .cornerRadius(7)
                        Text(title)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.panelText)
                    }
                    Text(prompt)
                        .font(.system(size: 11))
                        .foregroundColor(.panelText3)
                        .italic()
                    TextField("", text: Binding(get: { form[keyPath: keyPath] }, set: { form[keyPath: keyPath] = $0 }), axis: .vertical)
                        .lineLimit(3...6)
                        .font(.system(size: 14))
                        .padding(14)
                        .background(Color.panelCard)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.panelBorder))
                }
            }

            HStack(spacing: 12) {
                Button { step = 0 } label: {
                    Text("Wstecz")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.panelText2)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Color.panelCard)
                        .cornerRadius(12)
                }
                Button { save() } label: {
                    Text(isEditing ? "Zapisz" : "Utwórz cel")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(form.title.isEmpty ? Color.panelText3 : Color.accent)
                        .cornerRadius(12)
                }
                .disabled(form.title.isEmpty)
            }
        }
    }

    func save() {
        Task {
            if let g = editGoal { await store.updateGoal(g.id, data: form.payload) }
            else { _ = await store.createGoal(form.payload) }
            dismiss()
        }
    }
}
