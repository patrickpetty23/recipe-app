import PhotosUI
import SwiftUI
import UIKit

struct ScanRecipeView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    @State private var showCameraPicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Scan Recipe")
                    .font(.largeTitle.bold())

                Text("Capture a cookbook page or import a screenshot, then extract ingredients into an editable shopping list.")
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    Button {
                        showCameraPicker = true
                    } label: {
                        Label("Open Camera", systemImage: "camera")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!UIImagePickerController.isSourceTypeAvailable(.camera))

                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        Label("Import Photo", systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }

                Group {
                    if let image = viewModel.selectedImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 340)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                            )
                    } else {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.secondary.opacity(0.1))
                            .frame(height: 220)
                            .overlay(
                                VStack(spacing: 8) {
                                    Image(systemName: "doc.text.viewfinder")
                                        .font(.largeTitle)
                                        .foregroundStyle(.secondary)
                                    Text("No image selected")
                                        .foregroundStyle(.secondary)
                                }
                            )
                    }
                }

                Button {
                    Task { await viewModel.processSelectedImage() }
                } label: {
                    if viewModel.isProcessing {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Label("Extract Ingredients", systemImage: "text.viewfinder")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.selectedImage == nil || viewModel.isProcessing)

                if let warning = viewModel.lowConfidenceWarning {
                    Label(warning, systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                }

                if let message = viewModel.scanErrorMessage {
                    Label(message, systemImage: "xmark.octagon.fill")
                        .foregroundStyle(.red)
                }

                if viewModel.ocrConfidence > 0 {
                    HStack {
                        Text("OCR Confidence")
                        Spacer()
                        Text("\(Int(viewModel.ocrConfidence * 100))%")
                            .font(.headline)
                    }
                    ProgressView(value: viewModel.ocrConfidence)
                }
            }
            .padding()
        }
        .navigationTitle("Scanner")
        .sheet(isPresented: $showCameraPicker) {
            CameraImagePicker { image in
                viewModel.setSelectedImage(image)
            }
        }
        .sheet(isPresented: $viewModel.showEditor) {
            NavigationStack {
                IngredientEditorView()
                    .environmentObject(viewModel)
            }
        }
        .onChange(of: selectedPhotoItem) { _, newValue in
            guard let newValue else { return }
            Task {
                if let data = try? await newValue.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    viewModel.setSelectedImage(image)
                }
                selectedPhotoItem = nil
            }
        }
    }
}
