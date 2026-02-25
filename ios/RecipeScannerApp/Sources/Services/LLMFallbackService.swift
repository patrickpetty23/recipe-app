import Foundation
import UIKit
import RecipeCore

enum LLMFallbackError: LocalizedError {
    case disabled
    case notConfigured

    var errorDescription: String? {
        switch self {
        case .disabled:
            return "Cloud extraction is disabled in Settings."
        case .notConfigured:
            return "Cloud extraction is not configured yet."
        }
    }
}

final class LLMFallbackService {
    func extractIngredients(from _: UIImage) async throws -> [IngredientRecord] {
        throw LLMFallbackError.notConfigured
    }
}
