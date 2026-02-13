import Foundation

class APIService {
    static let shared = APIService()

    // CHANGE THIS to your hosting URL after uploading PHP files
    var baseURL = "https://webbiloo.atthost24.pl/api"

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        return d
    }()

    private func request<T: Decodable>(_ endpoint: String, method: String = "GET", body: [String: Any]? = nil) async throws -> T {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            throw URLError(.badURL)
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 15

        if let body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: req)

        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }

        return try decoder.decode(T.self, from: data)
    }

    // MARK: - Goals
    func getStats() async throws -> DashboardStats {
        try await request("goals.php?action=stats")
    }

    func getGoals(status: String? = nil, sort: String = "created") async throws -> [Goal] {
        var ep = "goals.php?sort=\(sort)"
        if let status { ep += "&status=\(status)" }
        return try await request(ep)
    }

    func getGoal(_ id: String) async throws -> Goal {
        try await request("goals.php?id=\(id)")
    }

    func createGoal(_ data: [String: Any]) async throws -> Goal {
        try await request("goals.php", method: "POST", body: data)
    }

    func updateGoal(_ id: String, data: [String: Any]) async throws -> Goal {
        try await request("goals.php?id=\(id)", method: "PUT", body: data)
    }

    func deleteGoal(_ id: String) async throws {
        let _: [String: Bool] = try await request("goals.php?id=\(id)", method: "DELETE")
    }

    // MARK: - Milestones
    func createMilestone(_ data: [String: Any]) async throws -> Milestone {
        try await request("milestones.php", method: "POST", body: data)
    }

    func updateMilestone(_ id: String, data: [String: Any]) async throws -> Milestone {
        try await request("milestones.php?id=\(id)", method: "PUT", body: data)
    }

    func deleteMilestone(_ id: String) async throws {
        let _: [String: Bool] = try await request("milestones.php?id=\(id)", method: "DELETE")
    }

    // MARK: - Tasks
    func createTask(_ data: [String: Any]) async throws -> GoalTask {
        try await request("tasks.php", method: "POST", body: data)
    }

    func updateTask(_ id: String, data: [String: Any]) async throws -> GoalTask {
        try await request("tasks.php?id=\(id)", method: "PUT", body: data)
    }

    func deleteTask(_ id: String) async throws {
        let _: [String: Bool] = try await request("tasks.php?id=\(id)", method: "DELETE")
    }

    // MARK: - Risks
    func createRisk(_ data: [String: Any]) async throws -> Risk {
        try await request("risks.php", method: "POST", body: data)
    }

    func updateRisk(_ id: String, data: [String: Any]) async throws -> Risk {
        try await request("risks.php?id=\(id)", method: "PUT", body: data)
    }

    func deleteRisk(_ id: String) async throws {
        let _: [String: Bool] = try await request("risks.php?id=\(id)", method: "DELETE")
    }

    // MARK: - Progress
    func createProgress(_ data: [String: Any]) async throws -> ProgressLog {
        try await request("progress.php", method: "POST", body: data)
    }
}
