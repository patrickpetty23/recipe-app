import Foundation
import UIKit

actor LocalStore {
    private let rootDirectory: URL
    private let stateFileURL: URL
    private let imageDirectory: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(fileManager: FileManager = .default) {
        let base = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
            .appendingPathComponent("RecipeScannerData", isDirectory: true)
        self.rootDirectory = base
        self.stateFileURL = base.appendingPathComponent("state.json")
        self.imageDirectory = base.appendingPathComponent("images", isDirectory: true)
        self.encoder = JSONEncoder()
        self.decoder = JSONDecoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.decoder.dateDecodingStrategy = .iso8601

        try? fileManager.createDirectory(at: rootDirectory, withIntermediateDirectories: true)
        try? fileManager.createDirectory(at: imageDirectory, withIntermediateDirectories: true)
    }

    func loadSnapshot() -> AppSnapshot {
        guard FileManager.default.fileExists(atPath: stateFileURL.path) else {
            return .empty
        }

        do {
            let data = try Data(contentsOf: stateFileURL)
            return try decoder.decode(AppSnapshot.self, from: data)
        } catch {
            AppLogger.shared.log(.error, event: "store_load_failed", metadata: ["error": error.localizedDescription])
            return .empty
        }
    }

    func saveSnapshot(_ snapshot: AppSnapshot) {
        do {
            let data = try encoder.encode(snapshot)
            try data.write(to: stateFileURL, options: .atomic)
        } catch {
            AppLogger.shared.log(.error, event: "store_save_failed", metadata: ["error": error.localizedDescription])
        }
    }

    func saveImage(_ image: UIImage) -> String? {
        guard let data = image.jpegData(compressionQuality: 0.8) else {
            return nil
        }
        let fileName = "\(UUID().uuidString).jpg"
        let fileURL = imageDirectory.appendingPathComponent(fileName)
        do {
            try data.write(to: fileURL, options: .atomic)
            return fileName
        } catch {
            AppLogger.shared.log(.warning, event: "image_save_failed", metadata: ["error": error.localizedDescription])
            return nil
        }
    }

    func loadImage(named fileName: String) -> UIImage? {
        let fileURL = imageDirectory.appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: fileURL) else {
            return nil
        }
        return UIImage(data: data)
    }
}
