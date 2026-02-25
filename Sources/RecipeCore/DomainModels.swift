import Foundation

public struct OCRLine: Codable, Hashable, Sendable {
    public var text: String
    public var confidence: Double

    public init(text: String, confidence: Double) {
        self.text = text
        self.confidence = confidence
    }
}

public struct IngredientRecord: Codable, Hashable, Identifiable, Sendable {
    public var id: UUID
    public var name: String
    public var quantity: String?
    public var unit: String?
    public var confidence: Double
    public var rawLine: String?

    public init(
        id: UUID = UUID(),
        name: String,
        quantity: String? = nil,
        unit: String? = nil,
        confidence: Double = 1.0,
        rawLine: String? = nil
    ) {
        self.id = id
        self.name = name
        self.quantity = quantity
        self.unit = unit
        self.confidence = confidence
        self.rawLine = rawLine
    }
}

public struct RecipeRecord: Codable, Hashable, Identifiable, Sendable {
    public var id: UUID
    public var name: String
    public var createdAt: Date
    public var ingredients: [IngredientRecord]
    public var imageFileName: String?

    public init(
        id: UUID = UUID(),
        name: String,
        createdAt: Date = Date(),
        ingredients: [IngredientRecord],
        imageFileName: String? = nil
    ) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
        self.ingredients = ingredients
        self.imageFileName = imageFileName
    }
}

public struct ShoppingListItemRecord: Codable, Hashable, Identifiable, Sendable {
    public var id: UUID
    public var name: String
    public var quantity: String?
    public var unit: String?
    public var isChecked: Bool
    public var sourceRecipeIDs: [UUID]

    public init(
        id: UUID = UUID(),
        name: String,
        quantity: String? = nil,
        unit: String? = nil,
        isChecked: Bool = false,
        sourceRecipeIDs: [UUID] = []
    ) {
        self.id = id
        self.name = name
        self.quantity = quantity
        self.unit = unit
        self.isChecked = isChecked
        self.sourceRecipeIDs = sourceRecipeIDs
    }
}

public struct ShoppingListRecord: Codable, Hashable, Identifiable, Sendable {
    public var id: UUID
    public var createdAt: Date
    public var items: [ShoppingListItemRecord]

    public init(
        id: UUID = UUID(),
        createdAt: Date = Date(),
        items: [ShoppingListItemRecord]
    ) {
        self.id = id
        self.createdAt = createdAt
        self.items = items
    }
}
