import SwiftUI

struct SettingsView: View {
    @State private var apiURL = APIService.shared.baseURL
    @State private var connectionStatus: String? = nil
    @State private var isTesting = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                // App Header
                VStack(spacing: 12) {
                    ZStack {
                        Circle().fill(Color.accentBg).frame(width: 72, height: 72)
                        Circle().stroke(Color.accent.opacity(0.3), lineWidth: 2).frame(width: 54, height: 54)
                        Text("GT")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundColor(.accent)
                    }
                    Text("GoalTracker SMART")
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .foregroundColor(.panelText)
                    Text("Wersja 1.0.0 · Native iPadOS")
                        .font(.system(size: 12))
                        .foregroundColor(.panelText3)
                    Text("Twój osobisty asystent w planowaniu i realizacji\ncelów zgodnie z metodologią SMART.")
                        .font(.system(size: 14))
                        .foregroundColor(.panelText2)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .whiteCard()

                // Server
                VStack(alignment: .leading, spacing: 14) {
                    Text("Serwer API")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.panelText)
                    TextField("URL API", text: $apiURL)
                        .font(.system(size: 14))
                        .padding(14)
                        .background(Color.panelCard)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.panelBorder))
                        .autocapitalization(.none)
                        .keyboardType(.URL)
                        .onSubmit { saveURL() }

                    HStack(spacing: 10) {
                        Button { saveURL() } label: {
                            Text("Zapisz")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(Color.accent)
                                .cornerRadius(10)
                        }
                        Button { testConnection() } label: {
                            HStack(spacing: 6) {
                                if isTesting { ProgressView().scaleEffect(0.7) }
                                Text("Test")
                            }
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.panelText2)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Color.panelCard)
                            .cornerRadius(10)
                        }
                    }

                    if let status = connectionStatus {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(status.contains("OK") ? Color.successGreen : Color.dangerRed)
                                .frame(width: 8, height: 8)
                            Text(status)
                                .font(.system(size: 12))
                                .foregroundColor(status.contains("OK") ? .successGreen : .dangerRed)
                        }
                    }
                }
                .whiteCard()

                // Widgets
                VStack(alignment: .leading, spacing: 10) {
                    Text("Widgety na ekranie głównym")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.panelText)
                    VStack(alignment: .leading, spacing: 8) {
                        stepRow(1, "Przytrzymaj palec na ekranie głównym")
                        stepRow(2, "Stuknij + w lewym górnym rogu")
                        stepRow(3, "Wyszukaj \"GoalTracker\"")
                        stepRow(4, "Wybierz rozmiar i dodaj")
                    }
                }
                .whiteCard()

                // Features
                VStack(alignment: .leading, spacing: 10) {
                    Text("Funkcje")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.panelText)
                    featureRow("Cele SMART", "Definiuj cele z oceną jakości", .goalPink)
                    featureRow("Kamienie milowe", "Śledź kluczowe etapy", .goalBlue)
                    featureRow("Zadania", "Zarządzaj zadaniami", .goalPurple)
                    featureRow("Macierz ryzyk", "Identyfikuj zagrożenia", .goalOrange)
                    featureRow("Planer", "Oś czasu, kalendarz, Kanban", .goalTeal)
                    featureRow("Widgety", "Countdown na ekranie głównym", .accent)
                }
                .whiteCard()
            }
            .padding(24)
        }
        .background(Color.panelBg)
    }

    func saveURL() {
        APIService.shared.baseURL = apiURL
        UserDefaults.standard.set(apiURL, forKey: "apiBaseURL")
        connectionStatus = "URL zapisany"
    }

    func testConnection() {
        isTesting = true
        connectionStatus = nil
        Task {
            do {
                let _: DashboardStats = try await APIService.shared.getStats()
                connectionStatus = "OK - Połączono"
            } catch {
                connectionStatus = "Błąd: \(error.localizedDescription)"
            }
            isTesting = false
        }
    }

    func stepRow(_ num: Int, _ text: String) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().fill(Color.accent).frame(width: 22, height: 22)
                Text("\(num)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
            }
            Text(text).font(.system(size: 13)).foregroundColor(.panelText2)
        }
    }

    func featureRow(_ title: String, _ desc: String, _ color: Color) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(color.opacity(0.15))
                .frame(width: 32, height: 32)
                .overlay(Circle().fill(color).frame(width: 10, height: 10))
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.system(size: 13, weight: .semibold)).foregroundColor(.panelText)
                Text(desc).font(.system(size: 11)).foregroundColor(.panelText3)
            }
        }
        .padding(.vertical, 3)
    }
}
