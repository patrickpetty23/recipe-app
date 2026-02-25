import XCTest
@testable import RecipeCore

final class IngredientParserTests: XCTestCase {
    func testSimpleLineParsesQuantityUnitAndName() {
        let parser = IngredientParser()
        let result = parser.parse(lines: [OCRLine(text: "2 cups flour", confidence: 0.9)])

        XCTAssertEqual(result.ingredients.count, 1)
        XCTAssertEqual(result.ingredients[0].quantity, "2")
        XCTAssertEqual(result.ingredients[0].unit, "cups")
        XCTAssertEqual(result.ingredients[0].name.lowercased(), "flour")
    }

    func testUnicodeFractionIsNormalized() {
        let parser = IngredientParser()
        let result = parser.parse(lines: [OCRLine(text: "½ tsp salt", confidence: 0.95)])

        XCTAssertEqual(result.ingredients.count, 1)
        XCTAssertEqual(result.ingredients[0].quantity, "1/2")
        XCTAssertEqual(result.ingredients[0].unit, "tsp")
        XCTAssertEqual(result.ingredients[0].name.lowercased(), "salt")
    }

    func testShoppingListBuilderMergesDuplicateIngredients() {
        let recipeA = RecipeRecord(
            name: "A",
            ingredients: [IngredientRecord(name: "Garlic", quantity: "2", unit: "cloves")]
        )
        let recipeB = RecipeRecord(
            name: "B",
            ingredients: [IngredientRecord(name: "garlic", quantity: "1", unit: "cloves")]
        )

        let merged = ShoppingListBuilder.merged(from: [recipeA, recipeB])
        XCTAssertEqual(merged.items.count, 1)
        XCTAssertEqual(merged.items[0].quantity, "3")
    }

    func testParserFixtureRunnerPassesFixture() {
        let fixture = ParserFixtureCase(
            name: "basic fixture",
            inputLines: ["1 tbsp olive oil"],
            expectedIngredients: [ExpectedIngredient(name: "olive oil", quantity: "1", unit: "tbsp")]
        )
        let result = ParserFixtureRunner.run(case: fixture)
        XCTAssertTrue(result.passed)
    }
}
