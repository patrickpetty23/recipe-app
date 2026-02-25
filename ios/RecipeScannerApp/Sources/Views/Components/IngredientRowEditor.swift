import SwiftUI
import RecipeCore

struct IngredientRowEditor: View {
    @Binding var ingredient: IngredientRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextField("Ingredient name", text: $ingredient.name)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

            HStack(spacing: 12) {
                TextField("Qty", text: Binding(
                    get: { ingredient.quantity ?? "" },
                    set: { ingredient.quantity = $0.isEmpty ? nil : $0 }
                ))
                .keyboardType(.numbersAndPunctuation)
                .frame(maxWidth: 100)

                TextField("Unit", text: Binding(
                    get: { ingredient.unit ?? "" },
                    set: { ingredient.unit = $0.isEmpty ? nil : $0 }
                ))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .frame(maxWidth: 120)
            }

            HStack {
                Text("Confidence")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                ProgressView(value: ingredient.confidence)
                    .tint(confidenceColor(ingredient.confidence))
                Text("\(Int(ingredient.confidence * 100))%")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func confidenceColor(_ value: Double) -> Color {
        switch value {
        case 0.8...:
            return .green
        case 0.5..<0.8:
            return .orange
        default:
            return .red
        }
    }
}
