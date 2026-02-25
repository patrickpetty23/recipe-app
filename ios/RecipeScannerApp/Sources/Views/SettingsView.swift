import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        Form {
            Section("Extraction") {
                Toggle("Use AI Cloud Extraction", isOn: Binding(
                    get: { viewModel.settings.useCloudFallback },
                    set: { value in
                        var updated = viewModel.settings
                        updated.useCloudFallback = value
                        viewModel.updateSettings(updated)
                    }
                ))

                VStack(alignment: .leading, spacing: 8) {
                    Text("Low Confidence Threshold")
                    Slider(value: Binding(
                        get: { viewModel.settings.lowConfidenceThreshold },
                        set: { value in
                            var updated = viewModel.settings
                            updated.lowConfidenceThreshold = value
                            viewModel.updateSettings(updated)
                        }
                    ), in: 0.4...0.95, step: 0.05)

                    Text("\(Int(viewModel.settings.lowConfidenceThreshold * 100))%")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Privacy") {
                Text("On-device OCR is used by default. Enable cloud extraction only if you accept sending images off-device.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Settings")
    }
}
