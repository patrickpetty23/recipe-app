// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "recipe-app",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "RecipeCore",
            targets: ["RecipeCore"]
        ),
        .executable(
            name: "RecipeCLITest",
            targets: ["RecipeCLITest"]
        )
    ],
    targets: [
        .target(
            name: "RecipeCore",
            path: "Sources/RecipeCore"
        ),
        .executableTarget(
            name: "RecipeCLITest",
            dependencies: ["RecipeCore"],
            path: "Sources/RecipeCLITest"
        ),
        .testTarget(
            name: "RecipeCoreTests",
            dependencies: ["RecipeCore"],
            path: "Tests/RecipeCoreTests"
        )
    ]
)
