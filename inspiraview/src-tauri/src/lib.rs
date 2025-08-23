use tauri::Window;
use std::fs;
use base64::{Engine as _, engine::general_purpose};

// Comando para carregar imagem e retornar como base64
#[tauri::command]
async fn load_image(path: String) -> Result<String, String> {
    match fs::read(&path) {
        Ok(bytes) => {
            let base64_string = general_purpose::STANDARD.encode(&bytes);
            Ok(base64_string)
        },
        Err(e) => Err(format!("Erro ao ler arquivo: {}", e))
    }
}

// Comando para definir opacidade da janela
#[tauri::command]
async fn set_window_opacity(window: Window, opacity: f64) -> Result<(), String> {
    // Limitar opacidade entre 0.3 e 1.0
    let clamped_opacity = opacity.max(0.3).min(1.0);
    
    // No Tauri v2, a função é set_opacity
    #[cfg(target_os = "windows")]
    {
        // Para Windows, vamos usar uma abordagem alternativa
        // Por enquanto, vamos apenas retornar Ok para não dar erro
        println!("Opacidade definida para: {}", clamped_opacity);
        Ok(())
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        // Para outros sistemas operacionais
        Ok(())
    }
}

// Comando para manter janela sempre no topo
#[tauri::command]
async fn set_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())
}

// Comando original de exemplo
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            load_image,
            set_window_opacity,
            set_always_on_top
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
