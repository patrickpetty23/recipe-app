import Foundation
import OSLog

enum LogLevel: String, Codable, Sendable {
    case debug
    case info
    case warning
    case error
}

struct LogEntry: Codable, Sendable {
    var timestamp: Date
    var level: LogLevel
    var event: String
    var metadata: [String: String]
}

actor LogFileWriter {
    private let fileURL: URL
    private let encoder: JSONEncoder

    init(fileURL: URL) {
        self.fileURL = fileURL
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }

    func append(_ entry: LogEntry) {
        do {
            let data = try encoder.encode(entry)
            if FileManager.default.fileExists(atPath: fileURL.path) {
                let handle = try FileHandle(forWritingTo: fileURL)
                defer { try? handle.close() }
                try handle.seekToEnd()
                handle.write(data)
                handle.write(Data("\n".utf8))
            } else {
                try data.appending(Data("\n".utf8)).write(to: fileURL, options: .atomic)
            }
        } catch {
            // Logging should never crash the app.
        }
    }
}

final class AppLogger {
    static let shared = AppLogger()

    private let logger = Logger(subsystem: "com.recipeapp.mobile", category: "app")
    private let writer: LogFileWriter

    private init() {
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            .appendingPathComponent("logs", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        self.writer = LogFileWriter(fileURL: directory.appendingPathComponent("app-log.jsonl"))
    }

    func log(_ level: LogLevel, event: String, metadata: [String: String] = [:]) {
        let encodedMetadata = metadata
            .map { "\($0.key)=\($0.value)" }
            .sorted()
            .joined(separator: ",")

        switch level {
        case .debug:
            logger.debug("\(event, privacy: .public) \(encodedMetadata, privacy: .public)")
        case .info:
            logger.info("\(event, privacy: .public) \(encodedMetadata, privacy: .public)")
        case .warning:
            logger.warning("\(event, privacy: .public) \(encodedMetadata, privacy: .public)")
        case .error:
            logger.error("\(event, privacy: .public) \(encodedMetadata, privacy: .public)")
        }

        Task {
            await writer.append(
                LogEntry(
                    timestamp: Date(),
                    level: level,
                    event: event,
                    metadata: metadata
                )
            )
        }
    }
}
