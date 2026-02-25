import SwiftUI
import RecipeCore

struct ShoppingListView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    @State private var showClearConfirmation = false

    var body: some View {
        Group {
            if let list = viewModel.activeShoppingList, !list.items.isEmpty {
                List {
                    ForEach(list.items) { item in
                        Button {
                            viewModel.toggleItem(item)
                        } label: {
                            HStack(alignment: .top) {
                                Image(systemName: item.isChecked ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(item.isChecked ? .green : .secondary)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.name)
                                        .strikethrough(item.isChecked, color: .secondary)
                                        .foregroundStyle(item.isChecked ? .secondary : .primary)

                                    Text(quantityLabel(for: item))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Shopping item \(item.name)")
                    }
                }
            } else {
                ContentUnavailableView(
                    "No Shopping List Yet",
                    systemImage: "cart.badge.plus",
                    description: Text("Scan a recipe and save it to generate your shopping checklist.")
                )
            }
        }
        .navigationTitle("Shopping List")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Clear All", role: .destructive) {
                    showClearConfirmation = true
                }
                .disabled(viewModel.activeShoppingList == nil)
            }
        }
        .alert("Clear shopping list?", isPresented: $showClearConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Clear", role: .destructive) {
                viewModel.clearShoppingList()
            }
        } message: {
            Text("This removes the active shopping list. Saved recipes will remain.")
        }
    }

    private func quantityLabel(for item: ShoppingListItemRecord) -> String {
        let quantity = item.quantity ?? ""
        let unit = item.unit ?? ""
        let combined = "\(quantity) \(unit)".trimmingCharacters(in: .whitespaces)
        return combined.isEmpty ? "Quantity not specified" : combined
    }
}
