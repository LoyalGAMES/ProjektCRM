import SwiftUI

@MainActor
class GoalStore: ObservableObject {
    @Published var stats: DashboardStats?
    @Published var goals: [Goal] = []
    @Published var currentGoal: Goal?
    @Published var isLoading = false
    @Published var error: String?

    private let api = APIService.shared

    func loadStats() async {
        isLoading = true
        do {
            stats = try await api.getStats()
            error = nil
        } catch { self.error = error.localizedDescription }
        isLoading = false
    }

    func loadGoals(status: String? = nil, sort: String = "created") async {
        isLoading = true
        do {
            goals = try await api.getGoals(status: status, sort: sort)
            error = nil
        } catch { self.error = error.localizedDescription }
        isLoading = false
    }

    func loadGoal(_ id: String) async {
        do {
            currentGoal = try await api.getGoal(id)
            error = nil
        } catch { self.error = error.localizedDescription }
    }

    func createGoal(_ data: [String: Any]) async -> Goal? {
        do {
            let g = try await api.createGoal(data)
            await loadGoals()
            return g
        } catch { self.error = error.localizedDescription; return nil }
    }

    func updateGoal(_ id: String, data: [String: Any]) async {
        do {
            _ = try await api.updateGoal(id, data: data)
            await loadGoal(id)
        } catch { self.error = error.localizedDescription }
    }

    func deleteGoal(_ id: String) async {
        do {
            try await api.deleteGoal(id)
            await loadGoals()
        } catch { self.error = error.localizedDescription }
    }

    func toggleMilestone(_ m: Milestone) async {
        do {
            _ = try await api.updateMilestone(m.id, data: ["is_completed": m.isDone ? 0 : 1])
            if let gid = currentGoal?.id { await loadGoal(gid) }
        } catch { self.error = error.localizedDescription }
    }

    func createMilestone(goalId: String, title: String, date: String?) async {
        var data: [String: Any] = ["goal_id": goalId, "title": title]
        if let date { data["target_date"] = date }
        do {
            _ = try await api.createMilestone(data)
            await loadGoal(goalId)
        } catch { self.error = error.localizedDescription }
    }

    func createTask(goalId: String, title: String, priority: String, dueDate: String?) async {
        var data: [String: Any] = ["goal_id": goalId, "title": title, "priority": priority]
        if let dueDate { data["due_date"] = dueDate }
        do {
            _ = try await api.createTask(data)
            await loadGoal(goalId)
        } catch { self.error = error.localizedDescription }
    }

    func cycleTaskStatus(_ t: GoalTask) async {
        let next: String
        switch t.status {
        case "todo": next = "in_progress"
        case "in_progress": next = "done"
        default: next = "todo"
        }
        do {
            _ = try await api.updateTask(t.id, data: ["status": next])
            if let gid = currentGoal?.id { await loadGoal(gid) }
        } catch { self.error = error.localizedDescription }
    }

    func createRisk(goalId: String, data: [String: Any]) async {
        var d = data
        d["goal_id"] = goalId
        do {
            _ = try await api.createRisk(d)
            await loadGoal(goalId)
        } catch { self.error = error.localizedDescription }
    }

    func addProgress(goalId: String, value: Double, notes: String, achievements: String, obstacles: String) async {
        do {
            _ = try await api.createProgress([
                "goal_id": goalId, "progress_value": value,
                "notes": notes, "achievements": achievements, "obstacles": obstacles
            ])
            await loadGoal(goalId)
        } catch { self.error = error.localizedDescription }
    }
}
