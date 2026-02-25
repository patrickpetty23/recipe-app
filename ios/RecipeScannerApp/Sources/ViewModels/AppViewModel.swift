import Foundation
import SwiftUI
import UIKit
import RecipeCore

@MainActor
final class AppViewModel: ObservableObject {
    @Published var recipes: [RecipeRecord] = []
    @Published var activeShoppingList: ShoppingListRecord?
    @Published var selectedImage: UIImage?
    @Published var draftRecipeName = ""
    @Published var draftIngredients: [IngredientRecord] = []
    @Published var rawOCRText = ""
    @Published var ocrConfidence: Double = 0
    @Published var droppedOCRLines: [String] = []
    @Published var isProcessing = false
    @Published var scanErrorMessage: String?
    @Published var showEditor = false
    @Published var settings: AppSettings = .default
    @Published var lowConfidenceWarning: String?

    private let store = LocalStore()
    private let ocrService = OCRService()
    private let fallbackService = LLMFallbackService()
    private let parser = IngredientParser()

    init() {
        Task {
            await loadState()
        }
    }

    func setSelectedImage(_ image: UIImage?) {
        selectedImage = image
        lowConfidenceWarning = nil
        scanErrorMessage = nil
    }

    func processSelectedImage() async {
        guard let image = selectedImage else {
            scanErrorMessage = "Select or capture a recipe image first."
            return
        }

        isProcessing = true
        scanErrorMessage = nil
        lowConfidenceWarning = nil
        AppLogger.shared.log(.info, event: "ocr_started")

        do {
            let extraction = try await ocrService.extract(from: image)
            let parseResult = parser.parse(lines: extraction.lines)

            rawOCRText = extraction.rawText
            ocrConfidence = extraction.averageConfidence
            draftIngredients = parseResult.ingredients
            droppedOCRLines = parseResult.droppedLines
            draftRecipeName = deriveRecipeName(from: extraction.rawText)

            if draftIngredients.isEmpty {
                scanErrorMessage = "No ingredient lines were found. Try another photo or add ingredients manually."
                AppLogger.shared.log(.warning, event: "ocr_no_ingredients")
                isProcessing = false
                return
            }

            if extraction.averageConfidence < settings.lowConfidenceThreshold {
                lowConfidenceWarning = "Low OCR confidence. Review extracted lines before saving."
                AppLogger.shared.log(
                    .warning,
                    event: "ocr_low_confidence",
                    metadata: ["confidence": String(format: "%.2f", extraction.averageConfidence)]
                )
            }

            if extraction.averageConfidence < settings.lowConfidenceThreshold && settings.useCloudFallback {
                do {
                    let fallback = try await fallbackService.extractIngredients(from: image)
                    if !fallback.isEmpty {
                        draftIngredients = fallback
                        lowConfidenceWarning = "Cloud extraction result loaded."
                    }
                } catch {
                    AppLogger.shared.log(.warning, event: "llm_fallback_failed", metadata: ["error": error.localizedDescription])
                }
            }

            showEditor = true
            AppLogger.shared.log(.info, event: "ocr_completed", metadata: ["ingredient_count": "\(draftIngredients.count)"])
        } catch {
            scanErrorMessage = error.localizedDescription
            AppLogger.shared.log(.error, event: "ocr_failed", metadata: ["error": error.localizedDescription])
        }

        isProcessing = false
    }

    func saveRecipeAndGenerateList() {
        let cleanName = draftRecipeName.trimmingCharacters(in: .whitespacesAndNewlines)
        let recipeName = cleanName.isEmpty ? "Untitled Recipe" : cleanName
        let sanitizedIngredients = draftIngredients.filter { !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

        guard !sanitizedIngredients.isEmpty else {
            scanErrorMessage = "Add at least one ingredient before saving."
            return
        }

        Task { @MainActor in
            let imageFileName: String?
            if let image = selectedImage {
                imageFileName = await store.saveImage(image)
            } else {
                imageFileName = nil
            }

            let recipe = RecipeRecord(
                name: recipeName,
                ingredients: sanitizedIngredients,
                imageFileName: imageFileName
            )

            recipes.insert(recipe, at: 0)
            if recipes.count > 50 {
                recipes = Array(recipes.prefix(50))
            }

            activeShoppingList = ShoppingListBuilder.from(recipe: recipe)
            showEditor = false
            selectedImage = nil
            rawOCRText = ""
            droppedOCRLines = []
            ocrConfidence = 0

            await persistState()
            AppLogger.shared.log(.info, event: "recipe_saved", metadata: ["recipe_id": recipe.id.uuidString])
        }
    }

    func loadImage(for recipe: RecipeRecord) async -> UIImage? {
        guard let fileName = recipe.imageFileName else { return nil }
        return await store.loadImage(named: fileName)
    }

    func regenerateShoppingList(from recipe: RecipeRecord) {
        activeShoppingList = ShoppingListBuilder.from(recipe: recipe)
        persistFromMainActor()
        AppLogger.shared.log(.info, event: "shopping_list_regenerated", metadata: ["recipe_id": recipe.id.uuidString])
    }

    func mergeShoppingList(from recipes: [RecipeRecord]) {
        activeShoppingList = ShoppingListBuilder.merged(from: recipes)
        persistFromMainActor()
        AppLogger.shared.log(.info, event: "shopping_list_merged", metadata: ["recipe_count": "\(recipes.count)"])
    }

    func toggleItem(_ item: ShoppingListItemRecord) {
        guard var list = activeShoppingList,
              let index = list.items.firstIndex(where: { $0.id == item.id }) else { return }
        list.items[index].isChecked.toggle()
        activeShoppingList = list
        persistFromMainActor()
    }

    func clearShoppingList() {
        activeShoppingList = nil
        persistFromMainActor()
    }

    func deleteRecipe(_ recipe: RecipeRecord) {
        recipes.removeAll { $0.id == recipe.id }
        persistFromMainActor()
    }

    func addBlankIngredient() {
        draftIngredients.append(
            IngredientRecord(
                name: "",
                quantity: nil,
                unit: nil,
                confidence: 0.5,
                rawLine: nil
            )
        )
    }

    func removeIngredient(at offsets: IndexSet) {
        draftIngredients.remove(atOffsets: offsets)
    }

    func updateSettings(_ updated: AppSettings) {
        settings = updated
        persistFromMainActor()
    }

    private func persistFromMainActor() {
        Task { await persistState() }
    }

    private func loadState() async {
        let snapshot = await store.loadSnapshot()
        recipes = snapshot.recipes.sorted(by: { $0.createdAt > $1.createdAt })
        activeShoppingList = snapshot.activeShoppingList
        settings = snapshot.settings
        AppLogger.shared.log(.info, event: "state_loaded", metadata: ["recipe_count": "\(recipes.count)"])
    }

    private func persistState() async {
        let snapshot = AppSnapshot(
            recipes: recipes,
            activeShoppingList: activeShoppingList,
            settings: settings
        )
        await store.saveSnapshot(snapshot)
    }

    private func deriveRecipeName(from rawText: String) -> String {
        let lines = rawText
            .split(whereSeparator: \.isNewline)
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        guard let first = lines.first else {
            return "Untitled Recipe"
        }

        if first.count > 40, lines.count > 1 {
            return String(lines[1].prefix(40))
        }
        return String(first.prefix(40))
    }
}
