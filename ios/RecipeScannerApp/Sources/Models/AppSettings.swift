import Foundation
import RecipeCore

struct AppSettings: Codable, Sendable {
    var useCloudFallback: Bool
    var lowConfidenceThreshold: Double

    static let `default` = AppSettings(
        useCloudFallback: false,
        lowConfidenceThreshold: 0.7
    )
}

struct AppSnapshot: Codable, Sendable {
    var recipes: [RecipeRecord]
    var activeShoppingList: ShoppingListRecord?
    var settings: AppSettings

    static let empty = AppSnapshot(
        recipes: [],
        activeShoppingList: nil,
        settings: .default
    )
}
