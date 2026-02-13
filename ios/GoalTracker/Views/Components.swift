import SwiftUI

// MARK: - Progress Bar (white panel)
struct ProgressBar: View {
    let value: Double
    var color: Color = .accent
    var bgColor: Color = Color.panelBorder
    var height: CGFloat = 6

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(bgColor)
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(color)
                    .frame(width: geo.size.width * min(max(value / 100, 0), 1))
                    .animation(.easeInOut(duration: 0.3), value: value)
            }
        }
        .frame(height: height)
    }
}

// MARK: - Badge
struct BadgeView: View {
    let text: String
    let color: Color
    var bgColor: Color? = nil

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(bgColor ?? color.opacity(0.1))
            .cornerRadius(8)
    }
}

// MARK: - Priority Dot + Text
struct PriorityBadge: View {
    let priority: GoalPriority

    var body: some View {
        HStack(spacing: 4) {
            Circle().fill(priority.color).frame(width: 6, height: 6)
            Text(priority.label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(priority.color)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(priority.bgColor)
        .cornerRadius(8)
    }
}

// MARK: - Countdown Badge
struct CountdownBadge: View {
    let targetDate: String?

    var body: some View {
        let cd = Countdown.from(targetDate)
        Text(cd.text)
            .font(.system(size: 13, weight: .bold, design: .rounded))
            .foregroundColor(cd.overdue ? .dangerRed : .infoBlue)
    }
}

// MARK: - SMART Pill Row
struct SMARTMini: View {
    let score: Double

    var body: some View {
        HStack(spacing: 3) {
            ForEach(Array("SMART".enumerated()), id: \.offset) { i, letter in
                Text(String(letter))
                    .font(.system(size: 9, weight: .bold))
                    .frame(width: 20, height: 20)
                    .background(Double(i) < score * 5 ? Color.accent : Color.panelBorder)
                    .foregroundColor(Double(i) < score * 5 ? .white : .panelText3)
                    .cornerRadius(5)
            }
        }
    }
}

// MARK: - Section Header (white panel)
struct SectionHeader: View {
    let title: String
    var action: (() -> Void)? = nil
    var actionLabel: String? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.panelText)
            Spacer()
            if let action, let label = actionLabel {
                Button(label, action: action)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.accent)
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Empty State
struct EmptyStateView: View {
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(spacing: 12) {
            Circle()
                .fill(Color.panelCard)
                .frame(width: 64, height: 64)
                .overlay(Circle().stroke(Color.panelBorder, lineWidth: 1))
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.panelText2)
            if let subtitle {
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundColor(.panelText3)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(40)
    }
}

// MARK: - White Card
struct WhiteCardModifier: ViewModifier {
    var borderColor: Color = .panelBorder

    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(Color.white)
            .cornerRadius(16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(borderColor, lineWidth: 1))
            .shadow(color: Color.black.opacity(0.03), radius: 8, y: 2)
    }
}

extension View {
    func whiteCard(borderColor: Color = .panelBorder) -> some View {
        modifier(WhiteCardModifier(borderColor: borderColor))
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let value: String
    let label: String
    var color: Color = .accent

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(value)
                .font(.system(size: 26, weight: .heavy, design: .rounded))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(.panelText2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white)
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.panelBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.02), radius: 6, y: 2)
    }
}

// MARK: - Panel Tab Picker
struct PanelTabPicker: View {
    @Binding var selected: Int
    let labels: [String]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(Array(labels.enumerated()), id: \.offset) { i, label in
                    Button { selected = i } label: {
                        VStack(spacing: 6) {
                            Text(label)
                                .font(.system(size: 13, weight: selected == i ? .bold : .medium))
                                .foregroundColor(selected == i ? .accent : .panelText3)
                            Rectangle()
                                .fill(selected == i ? Color.accent : Color.clear)
                                .frame(height: 2.5)
                                .cornerRadius(2)
                        }
                        .padding(.horizontal, 14)
                    }
                }
            }
        }
        .padding(.bottom, 4)
    }
}

// MARK: - Circle Checkbox
struct CircleCheck: View {
    let checked: Bool
    var color: Color = .accent

    var body: some View {
        ZStack {
            Circle()
                .stroke(checked ? color : Color.panelBorder, lineWidth: 2)
                .frame(width: 22, height: 22)
            if checked {
                Circle().fill(color).frame(width: 22, height: 22)
                Image(systemName: "checkmark")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
            }
        }
    }
}

// MARK: - Add Button
struct AddButton: View {
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Circle()
                    .stroke(Color.accent, style: StrokeStyle(lineWidth: 1.5, dash: [3]))
                    .frame(width: 22, height: 22)
                    .overlay(Text("+").font(.system(size: 14, weight: .medium)).foregroundColor(.accent))
                Text(label)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.accent)
            }
            .padding(.vertical, 8)
        }
    }
}
