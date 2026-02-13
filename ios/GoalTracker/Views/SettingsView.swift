import SwiftUI

struct SettingsView: View {
    @State private var apiURL = APIService.shared.baseURL
    @State private var connectionStatus: String? = nil
    @State private var isTesting = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // App Info
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 12) {
                            Image(systemName: "target")
                                .font(.system(size: 32))
                                .foregroundColor(.primary)
                                .frame(width: 60, height: 60)
                                .background(Color.primary.opacity(0.15))
                                .cornerRadius(14)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("GoalTracker SMART")
                                    .font(.system(size: 20, weight: .heavy))
                                Text("Wersja 1.0.0 (Native iPadOS)")
                                    .font(.caption).foregroundColor(.text3)
                            }
                        }
                        Text("Twój osobisty asystent w planowaniu i realizacji celów zgodnie z metodologią SMART. Zarządzaj celami, planuj etapy, monitoruj ryzyka i śledź postępy.")
                            .font(.subheadline).foregroundColor(.text2).lineSpacing(4)
                    }
                    .cardStyle()

                    // Server
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Serwer API").font(.system(size: 18, weight: .bold))
                        TextField("URL API", text: $apiURL)
                            .textFieldStyle(.plain)
                            .padding(14)
                            .background(Color.card)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.border))
                            .autocapitalization(.none)
                            .keyboardType(.URL)
                            .onSubmit { saveURL() }

                        HStack(spacing: 12) {
                            Button { saveURL() } label: {
                                Text("Zapisz")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 20).padding(.vertical, 10)
                                    .background(Color.primary)
                                    .cornerRadius(10)
                            }

                            Button { testConnection() } label: {
                                HStack(spacing: 6) {
                                    if isTesting { ProgressView().scaleEffect(0.8) }
                                    Text("Test połączenia")
                                }
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.text2)
                                .padding(.horizontal, 20).padding(.vertical, 10)
                                .background(Color.card)
                                .cornerRadius(10)
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.border))
                            }
                        }

                        if let status = connectionStatus {
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(status.contains("OK") ? Color.success : Color.danger)
                                    .frame(width: 10, height: 10)
                                Text(status)
                                    .font(.caption)
                                    .foregroundColor(status.contains("OK") ? .success : .danger)
                            }
                        }
                    }
                    .cardStyle()

                    // Widgets Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Widgety").font(.system(size: 18, weight: .bold))
                        Text("Aby dodać widget na ekran główny iPada:")
                            .font(.subheadline).foregroundColor(.text2)
                        VStack(alignment: .leading, spacing: 6) {
                            infoRow("1", "Przytrzymaj palec na ekranie głównym")
                            infoRow("2", "Stuknij + w lewym górnym rogu")
                            infoRow("3", "Wyszukaj \"GoalTracker\"")
                            infoRow("4", "Wybierz rozmiar widgetu i dodaj")
                        }
                    }
                    .cardStyle()

                    // Features
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Funkcje").font(.system(size: 18, weight: .bold))
                        featureRow("target", "Cele SMART", "Definiuj cele z oceną jakości S.M.A.R.T.")
                        featureRow("flag.fill", "Kamienie milowe", "Śledź kluczowe etapy realizacji")
                        featureRow("checklist", "Zadania", "Zarządzaj zadaniami dla każdego celu")
                        featureRow("exclamationmark.triangle.fill", "Macierz ryzyk", "Identyfikuj i mityguj zagrożenia")
                        featureRow("calendar", "Planer", "Oś czasu, kalendarz i widok Kanban")
                        featureRow("square.grid.2x2.fill", "Widgety", "Countdown i postęp na ekranie głównym")
                    }
                    .cardStyle()
                }
                .padding()
            }
            .background(Color.bg)
            .navigationTitle("Info")
        }
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
                connectionStatus = "OK - Połączono z serwerem"
            } catch {
                connectionStatus = "Błąd: \(error.localizedDescription)"
            }
            isTesting = false
        }
    }

    func infoRow(_ num: String, _ text: String) -> some View {
        HStack(spacing: 10) {
            Text(num)
                .font(.system(size: 12, weight: .bold))
                .frame(width: 22, height: 22)
                .background(Color.primary)
                .foregroundColor(.white)
                .clipShape(Circle())
            Text(text).font(.subheadline).foregroundColor(.text2)
        }
    }

    func featureRow(_ icon: String, _ title: String, _ desc: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.primary)
                .frame(width: 32, height: 32)
                .background(Color.primary.opacity(0.15))
                .cornerRadius(8)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.system(size: 14, weight: .semibold))
                Text(desc).font(.caption).foregroundColor(.text2)
            }
        }
        .padding(.vertical, 4)
    }
}
