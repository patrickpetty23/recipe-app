import SwiftUI
import RecipeCore

struct IngredientEditorView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            Section("Recipe") {
                TextField("Recipe name", text: $viewModel.draftRecipeName)
            }

            Section("Ingredients") {
                ForEach($viewModel.draftIngredients) { $ingredient in
                    IngredientRowEditor(ingredient: $ingredient)
                }
                .onDelete(perform: viewModel.removeIngredient)

                Button {
                    viewModel.addBlankIngredient()
                } label: {
                    Label("Add Ingredient", systemImage: "plus")
                }
            }

            if !viewModel.droppedOCRLines.isEmpty {
                Section("Dropped OCR Lines") {
                    ForEach(viewModel.droppedOCRLines, id: \.self) { line in
                        Text(line)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Review Ingredients")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Close") {
                    viewModel.showEditor = false
                    dismiss()
                }
            }

            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    viewModel.saveRecipeAndGenerateList()
                    dismiss()
                }
                .disabled(viewModel.draftIngredients.isEmpty)
            }
        }
    }
}
