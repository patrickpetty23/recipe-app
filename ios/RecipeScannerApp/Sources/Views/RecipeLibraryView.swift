import SwiftUI
import RecipeCore

struct RecipeLibraryView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        Group {
            if viewModel.recipes.isEmpty {
                ContentUnavailableView(
                    "No Saved Recipes",
                    systemImage: "book.closed",
                    description: Text("Scanned recipes are saved here for quick reuse.")
                )
            } else {
                List {
                    ForEach(viewModel.recipes) { recipe in
                        NavigationLink {
                            RecipeDetailView(recipe: recipe)
                                .environmentObject(viewModel)
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(recipe.name)
                                    .font(.headline)
                                Text("\(recipe.ingredients.count) ingredients")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Text(recipe.createdAt.formatted(date: .abbreviated, time: .shortened))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .onDelete { offsets in
                        for index in offsets {
                            viewModel.deleteRecipe(viewModel.recipes[index])
                        }
                    }
                }
            }
        }
        .navigationTitle("Recipes")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Merge All") {
                    viewModel.mergeShoppingList(from: viewModel.recipes)
                }
                .disabled(viewModel.recipes.count < 2)
            }
        }
    }
}

private struct RecipeDetailView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    let recipe: RecipeRecord
    @State private var image: UIImage?

    var body: some View {
        List {
            if let image {
                Section("Source Image") {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 260)
                        .frame(maxWidth: .infinity)
                }
            }

            Section("Ingredients") {
                ForEach(recipe.ingredients) { ingredient in
                    HStack {
                        Text(ingredient.name)
                        Spacer()
                        Text(label(for: ingredient))
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section {
                Button {
                    viewModel.regenerateShoppingList(from: recipe)
                } label: {
                    Label("Generate Shopping List", systemImage: "cart.badge.plus")
                }
            }
        }
        .navigationTitle(recipe.name)
        .task {
            image = await viewModel.loadImage(for: recipe)
        }
    }

    private func label(for ingredient: IngredientRecord) -> String {
        let quantity = ingredient.quantity ?? ""
        let unit = ingredient.unit ?? ""
        let value = "\(quantity) \(unit)".trimmingCharacters(in: .whitespaces)
        return value.isEmpty ? "-" : value
    }
}
