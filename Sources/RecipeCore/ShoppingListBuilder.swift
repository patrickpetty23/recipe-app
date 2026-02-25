import Foundation

public enum ShoppingListBuilder {
    public static func from(recipe: RecipeRecord) -> ShoppingListRecord {
        let items = recipe.ingredients.map { ingredient in
            ShoppingListItemRecord(
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                sourceRecipeIDs: [recipe.id]
            )
        }
        return ShoppingListRecord(items: items)
    }

    public static func merged(from recipes: [RecipeRecord]) -> ShoppingListRecord {
        var index: [String: ShoppingListItemRecord] = [:]

        for recipe in recipes {
            for ingredient in recipe.ingredients {
                let key = normalizedKey(name: ingredient.name, unit: ingredient.unit)
                if var existing = index[key] {
                    existing.quantity = mergeQuantities(existing.quantity, ingredient.quantity)
                    existing.sourceRecipeIDs.append(recipe.id)
                    index[key] = existing
                } else {
                    index[key] = ShoppingListItemRecord(
                        name: ingredient.name,
                        quantity: ingredient.quantity,
                        unit: ingredient.unit,
                        sourceRecipeIDs: [recipe.id]
                    )
                }
            }
        }

        let sorted = index.values.sorted { lhs, rhs in
            lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
        }

        return ShoppingListRecord(items: sorted)
    }

    private static func normalizedKey(name: String, unit: String?) -> String {
        let normalizedName = name
            .lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        let normalizedUnit = unit?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) ?? "-"
        return "\(normalizedName)|\(normalizedUnit)"
    }

    private static func mergeQuantities(_ lhs: String?, _ rhs: String?) -> String? {
        switch (lhs, rhs) {
        case let (.some(left), .some(right)):
            if let total = QuantityMath.add(left, right) {
                return total
            }
            return "\(left) + \(right)"
        case let (.some(left), .none):
            return left
        case let (.none, .some(right)):
            return right
        case (.none, .none):
            return nil
        }
    }
}

enum QuantityMath {
    static func add(_ first: String, _ second: String) -> String? {
        guard let lhs = parse(first), let rhs = parse(second) else {
            return nil
        }
        let sum = lhs + rhs
        if sum.rounded() == sum {
            return String(Int(sum))
        }
        return String(format: "%.2f", sum).replacingOccurrences(of: "\\.?0+$", with: "", options: .regularExpression)
    }

    private static func parse(_ value: String) -> Double? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if let direct = Double(trimmed) { return direct }
        if trimmed.contains(" ") {
            let parts = trimmed.split(separator: " ")
            guard parts.count == 2, let whole = Double(parts[0]), let fraction = parseFraction(String(parts[1])) else {
                return nil
            }
            return whole + fraction
        }
        return parseFraction(trimmed)
    }

    private static func parseFraction(_ value: String) -> Double? {
        let parts = value.split(separator: "/")
        guard parts.count == 2, let numerator = Double(parts[0]), let denominator = Double(parts[1]), denominator != 0 else {
            return nil
        }
        return numerator / denominator
    }
}
