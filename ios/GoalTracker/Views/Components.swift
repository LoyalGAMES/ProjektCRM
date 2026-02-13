import SwiftUI

// MARK: - Stat Card
struct StatCard: View {
    let value: String
    let label: String
    var color: Color = .primary

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 28, weight: .heavy, design: .rounded))
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.text2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.card)
        .cornerRadius(16)
        .overlay(alignment: .leading) {
            Rectangle().fill(color).frame(width: 4).cornerRadius(2)
        }
    }
}

// MARK: - Progress Bar
struct ProgressBar: View {
    let value: Double
    var color: Color = .primary
    var height: CGFloat = 6

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Color.surfaceHL)
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

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .cornerRadius(12)
    }
}

// MARK: - Priority Badge
struct PriorityBadge: View {
    let priority: GoalPriority

    var body: some View {
        HStack(spacing: 4) {
            Circle().fill(priority.color).frame(width: 6, height: 6)
            Text(priority.label).font(.system(size: 11, weight: .semibold)).foregroundColor(priority.color)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(priority.color.opacity(0.15))
        .cornerRadius(8)
    }
}

// MARK: - Countdown Badge
struct CountdownBadge: View {
    let targetDate: String?

    var body: some View {
        let cd = Countdown.from(targetDate)
        Text(cd.text)
            .font(.system(size: 14, weight: .bold, design: .rounded))
            .foregroundColor(cd.overdue ? .danger : .primary)
    }
}

// MARK: - SMART Mini Dots
struct SMARTMini: View {
    let score: Double

    var body: some View {
        HStack(spacing: 2) {
            ForEach(Array("SMART".enumerated()), id: \.offset) { i, letter in
                Text(String(letter))
                    .font(.system(size: 9, weight: .bold))
                    .frame(width: 18, height: 18)
                    .background(Double(i) < score * 5 ? Color.primary : Color.surfaceHL)
                    .foregroundColor(Double(i) < score * 5 ? .white : .text3)
                    .cornerRadius(4)
            }
        }
    }
}

// MARK: - Category Icon
struct CategoryIcon: View {
    let category: GoalCategory
    var size: CGFloat = 32

    var body: some View {
        Image(systemName: category.icon)
            .font(.system(size: size * 0.5))
            .foregroundColor(category.color)
            .frame(width: size, height: size)
            .background(category.color.opacity(0.15))
            .cornerRadius(size * 0.25)
    }
}

// MARK: - Section Header
struct SectionHeader: View {
    let title: String
    var action: (() -> Void)? = nil
    var actionLabel: String? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 20, weight: .bold))
            Spacer()
            if let action, let label = actionLabel {
                Button(label, action: action)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Empty State
struct EmptyStateView: View {
    let icon: String
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(.text3)
            Text(title)
                .font(.headline)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(.text2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(60)
    }
}

// MARK: - Card Modifier
struct CardModifier: ViewModifier {
    var borderColor: Color? = nil

    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(Color.card)
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(borderColor ?? Color.border, lineWidth: 1)
            )
    }
}

extension View {
    func cardStyle(borderColor: Color? = nil) -> some View {
        modifier(CardModifier(borderColor: borderColor))
    }
}
