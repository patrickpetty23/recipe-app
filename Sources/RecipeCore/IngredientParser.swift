import Foundation

public struct IngredientParserConfig: Sendable {
    public var commonUnits: Set<String>
    public var blockedPrefixTokens: Set<String>

    public init(
        commonUnits: Set<String> = [
            "c", "cup", "cups",
            "tbsp", "tablespoon", "tablespoons",
            "tsp", "teaspoon", "teaspoons",
            "oz", "ounce", "ounces",
            "lb", "lbs", "pound", "pounds",
            "g", "gram", "grams",
            "kg", "ml", "l",
            "clove", "cloves",
            "can", "cans",
            "pkg", "package", "packages",
            "pinch", "dash"
        ],
        blockedPrefixTokens: Set<String> = [
            "instructions", "direction", "directions", "steps", "method", "serves", "yield"
        ]
    ) {
        self.commonUnits = commonUnits
        self.blockedPrefixTokens = blockedPrefixTokens
    }
}

public struct IngredientParseResult: Sendable {
    public var ingredients: [IngredientRecord]
    public var droppedLines: [String]

    public init(ingredients: [IngredientRecord], droppedLines: [String]) {
        self.ingredients = ingredients
        self.droppedLines = droppedLines
    }
}

public struct IngredientParser: Sendable {
    public let config: IngredientParserConfig

    public init(config: IngredientParserConfig = IngredientParserConfig()) {
        self.config = config
    }

    public func parse(lines: [OCRLine]) -> IngredientParseResult {
        var ingredients: [IngredientRecord] = []
        var dropped: [String] = []

        for line in lines {
            let cleaned = normalize(line.text)
            guard !cleaned.isEmpty else { continue }

            guard isLikelyIngredientLine(cleaned) else {
                dropped.append(cleaned)
                continue
            }

            if let parsed = parseSingleLine(cleaned, confidence: line.confidence) {
                ingredients.append(parsed)
            } else {
                dropped.append(cleaned)
            }
        }

        return IngredientParseResult(ingredients: ingredients, droppedLines: dropped)
    }

    public func parse(text: String, defaultConfidence: Double = 0.85) -> IngredientParseResult {
        let lines = text
            .split(whereSeparator: \.isNewline)
            .map { OCRLine(text: String($0), confidence: defaultConfidence) }
        return parse(lines: lines)
    }

    private func parseSingleLine(_ line: String, confidence: Double) -> IngredientRecord? {
        var tokens = line
            .split(separator: " ")
            .map(String.init)
        guard !tokens.isEmpty else { return nil }

        var quantityParts: [String] = []
        while let first = tokens.first, isQuantityToken(first) {
            quantityParts.append(tokens.removeFirst())
            if quantityParts.count == 2 { break }
        }

        var unit: String?
        if let first = tokens.first {
            let normalizedUnit = normalizeUnitToken(first)
            if config.commonUnits.contains(normalizedUnit) {
                unit = normalizedUnit
                _ = tokens.removeFirst()
            }
        }

        let rawName = tokens.joined(separator: " ").trimmingCharacters(in: .whitespaces)
        guard !rawName.isEmpty else {
            if quantityParts.isEmpty { return nil }
            return IngredientRecord(
                name: line,
                quantity: quantityParts.joined(separator: " "),
                unit: unit,
                confidence: min(1.0, confidence),
                rawLine: line
            )
        }

        var score = confidence
        if !quantityParts.isEmpty { score += 0.08 }
        if unit != nil { score += 0.08 }
        if rawName.count < 3 { score -= 0.15 }

        return IngredientRecord(
            name: rawName,
            quantity: quantityParts.isEmpty ? nil : quantityParts.joined(separator: " "),
            unit: unit,
            confidence: min(max(score, 0.0), 1.0),
            rawLine: line
        )
    }

    private func isLikelyIngredientLine(_ line: String) -> Bool {
        let lower = line.lowercased()

        if let firstToken = lower.split(separator: " ").first,
           config.blockedPrefixTokens.contains(String(firstToken)) {
            return false
        }

        if lower.contains("http://") || lower.contains("https://") {
            return false
        }

        let alphaCount = line.unicodeScalars.filter(CharacterSet.letters.contains).count
        if alphaCount < 2 {
            return false
        }

        return true
    }

    private func normalize(_ text: String) -> String {
        let replacements: [String: String] = [
            "•": " ",
            "- ": " ",
            "—": " ",
            "\t": " "
        ]

        var value = text.trimmingCharacters(in: .whitespacesAndNewlines)
        for (key, replacement) in replacements {
            value = value.replacingOccurrences(of: key, with: replacement)
        }

        value = value.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        value = replaceUnicodeFractions(in: value)
        return value.trimmingCharacters(in: .whitespaces)
    }

    private func replaceUnicodeFractions(in text: String) -> String {
        let fractionMap: [Character: String] = [
            "¼": "1/4",
            "½": "1/2",
            "¾": "3/4",
            "⅓": "1/3",
            "⅔": "2/3",
            "⅛": "1/8",
            "⅜": "3/8",
            "⅝": "5/8",
            "⅞": "7/8"
        ]

        var output = ""
        output.reserveCapacity(text.count)
        for character in text {
            if let replacement = fractionMap[character] {
                output.append(replacement)
            } else {
                output.append(character)
            }
        }
        return output
    }

    private func normalizeUnitToken(_ token: String) -> String {
        token
            .lowercased()
            .trimmingCharacters(in: .punctuationCharacters)
    }

    private func isQuantityToken(_ token: String) -> Bool {
        let normalized = token
            .lowercased()
            .trimmingCharacters(in: .punctuationCharacters)

        if normalized.isEmpty { return false }
        if normalized.range(of: #"^\d+$"#, options: .regularExpression) != nil { return true }
        if normalized.range(of: #"^\d+/\d+$"#, options: .regularExpression) != nil { return true }
        if normalized.range(of: #"^\d+\.\d+$"#, options: .regularExpression) != nil { return true }
        if normalized.range(of: #"^\d+-\d+$"#, options: .regularExpression) != nil { return true }
        return false
    }
}
