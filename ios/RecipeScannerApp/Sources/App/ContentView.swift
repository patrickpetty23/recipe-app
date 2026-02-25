import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            NavigationStack {
                ScanRecipeView()
            }
            .tabItem {
                Label("Scan", systemImage: "camera.viewfinder")
            }

            NavigationStack {
                RecipeLibraryView()
            }
            .tabItem {
                Label("Recipes", systemImage: "book.closed")
            }

            NavigationStack {
                ShoppingListView()
            }
            .tabItem {
                Label("Shopping", systemImage: "cart")
            }

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
    }
}
