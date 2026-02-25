import CoreImage
import Foundation
import UIKit
import Vision
import RecipeCore

enum OCRServiceError: LocalizedError {
    case imageConversionFailed
    case noTextDetected
    case processingFailed(String)

    var errorDescription: String? {
        switch self {
        case .imageConversionFailed:
            return "Could not process the image for OCR."
        case .noTextDetected:
            return "No text was detected. Try retaking the photo in better lighting."
        case .processingFailed(let message):
            return message
        }
    }
}

struct OCRExtractionOutput: Sendable {
    var lines: [OCRLine]
    var rawText: String
    var averageConfidence: Double
}

final class OCRService {
    private let ciContext = CIContext()

    func extract(from image: UIImage) async throws -> OCRExtractionOutput {
        guard let cgImage = preprocess(image: image) else {
            throw OCRServiceError.imageConversionFailed
        }

        let observations: [VNRecognizedTextObservation] = try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error {
                    continuation.resume(throwing: OCRServiceError.processingFailed(error.localizedDescription))
                    return
                }
                guard let observations = request.results as? [VNRecognizedTextObservation] else {
                    continuation.resume(returning: [])
                    return
                }
                continuation.resume(returning: observations)
            }

            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.minimumTextHeight = 0.015

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    try handler.perform([request])
                } catch {
                    continuation.resume(throwing: OCRServiceError.processingFailed(error.localizedDescription))
                }
            }
        }

        let lines = observations.compactMap { observation -> OCRLine? in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            return OCRLine(text: candidate.string, confidence: Double(candidate.confidence))
        }

        guard !lines.isEmpty else {
            throw OCRServiceError.noTextDetected
        }

        let average = lines.map(\.confidence).reduce(0, +) / Double(lines.count)
        let rawText = lines.map(\.text).joined(separator: "\n")
        return OCRExtractionOutput(lines: lines, rawText: rawText, averageConfidence: average)
    }

    private func preprocess(image: UIImage) -> CGImage? {
        guard let ciImage = image.ciImage ?? image.cgImage.map({ CIImage(cgImage: $0) }) else {
            return nil
        }

        let orientationFixed = ciImage.oriented(forExifOrientation: Int32(image.imageOrientation.exifOrientation))

        // Improve OCR contrast on cookbook pages and screenshots.
        let filter = CIFilter.colorControls()
        filter.inputImage = orientationFixed
        filter.contrast = 1.25
        filter.brightness = 0.02
        filter.saturation = 0.0

        guard let output = filter.outputImage else {
            return image.cgImage
        }
        return ciContext.createCGImage(output, from: output.extent)
    }
}

private extension UIImage.Orientation {
    var exifOrientation: UInt32 {
        switch self {
        case .up: return 1
        case .down: return 3
        case .left: return 8
        case .right: return 6
        case .upMirrored: return 2
        case .downMirrored: return 4
        case .leftMirrored: return 5
        case .rightMirrored: return 7
        @unknown default: return 1
        }
    }
}
