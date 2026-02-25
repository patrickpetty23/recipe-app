import Foundation
import RecipeCore

#if canImport(Darwin)
import Darwin
#else
import Glibc
#endif

let arguments = CommandLine.arguments
let fixturePath: String

if let index = arguments.firstIndex(of: "--fixtures"), arguments.indices.contains(index + 1) {
    fixturePath = arguments[index + 1]
} else {
    fixturePath = "fixtures/parser-fixtures.json"
}

do {
    let data = try Data(contentsOf: URL(fileURLWithPath: fixturePath))
    let fixtures = try JSONDecoder().decode(ParserFixtureFile.self, from: data)

    var failed = 0
    for fixtureCase in fixtures.cases {
        let result = ParserFixtureRunner.run(case: fixtureCase)
        if result.passed {
            print("PASS \(fixtureCase.name)")
        } else {
            failed += 1
            print("FAIL \(fixtureCase.name)")
            for detail in result.details {
                print("  - \(detail)")
            }
        }
    }

    print("Summary: \(fixtures.cases.count - failed)/\(fixtures.cases.count) passed")
    exit(failed == 0 ? 0 : 1)
} catch {
    print("Failed to run parser fixtures: \(error.localizedDescription)")
    exit(2)
}
