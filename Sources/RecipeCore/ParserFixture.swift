import Foundation

public struct ParserFixtureFile: Codable, Sendable {
    public var cases: [ParserFixtureCase]

    public init(cases: [ParserFixtureCase]) {
        self.cases = cases
    }
}

public struct ParserFixtureCase: Codable, Sendable {
    public var name: String
    public var inputLines: [String]
    public var expectedIngredients: [ExpectedIngredient]

    public init(name: String, inputLines: [String], expectedIngredients: [ExpectedIngredient]) {
        self.name = name
        self.inputLines = inputLines
        self.expectedIngredients = expectedIngredients
    }
}

public struct ExpectedIngredient: Codable, Sendable {
    public var name: String
    public var quantity: String?
    public var unit: String?

    public init(name: String, quantity: String? = nil, unit: String? = nil) {
        self.name = name
        self.quantity = quantity
        self.unit = unit
    }
}

public struct ParserFixtureResult: Sendable {
    public var passed: Bool
    public var details: [String]

    public init(passed: Bool, details: [String]) {
        self.passed = passed
        self.details = details
    }
}

public enum ParserFixtureRunner {
    public static func run(case fixtureCase: ParserFixtureCase, parser: IngredientParser = IngredientParser()) -> ParserFixtureResult {
        let lines = fixtureCase.inputLines.map { OCRLine(text: $0, confidence: 0.9) }
        let output = parser.parse(lines: lines).ingredients
        var failures: [String] = []

        if output.count != fixtureCase.expectedIngredients.count {
            failures.append("expected count \(fixtureCase.expectedIngredients.count), got \(output.count)")
        }

        let pairCount = min(output.count, fixtureCase.expectedIngredients.count)
        for index in 0..<pairCount {
            let actual = output[index]
            let expected = fixtureCase.expectedIngredients[index]

            if actual.name.lowercased() != expected.name.lowercased() {
                failures.append("[\(index)] name expected '\(expected.name)' got '\(actual.name)'")
            }

            if (actual.quantity ?? "") != (expected.quantity ?? "") {
                failures.append("[\(index)] quantity expected '\(expected.quantity ?? "nil")' got '\(actual.quantity ?? "nil")'")
            }

            if (actual.unit ?? "") != (expected.unit ?? "") {
                failures.append("[\(index)] unit expected '\(expected.unit ?? "nil")' got '\(actual.unit ?? "nil")'")
            }
        }

        return ParserFixtureResult(passed: failures.isEmpty, details: failures)
    }
}
