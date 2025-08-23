#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{command, Window, Manager};
use std::path::PathBuf;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[command]
async fn load_image(path: String) -> Result<String, String> {
    use std::fs;
    
    match fs::read(&path) {
        Ok(bytes) => {
            let base64_string = base64::encode(&bytes);
            Ok(base64_string)
        },
        Err(e) => Err(format!("Erro ao ler arquivo: {}", e))
    }
}

#[command]
async fn set_window_opacity(window: Window, opacity: f64) -> Result<(), String> {
    // Clamping opacity between 0.3 and 1.0
    let clamped_opacity = opacity.max(0.3).min(1.0);
    window.set_opacity(clamped_opacity).map_err(|e| e.to_string())
}

#[command]
async fn set_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())
}

#[command]
async fn get_image_info(path: String) -> Result<(u32, u32), String> {
    use std::fs::File;
    use std::io::BufReader;
    
    match File::open(&path) {
        Ok(file) => {
            let reader = BufReader::new(file);
            // Here you would use an image library to get dimensions
            // For now, returning placeholder values
            Ok((800, 600))
        },
        Err(e) => Err(format!("Erro ao obter informações da imagem: {}", e))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_image,
            set_window_opacity,
            set_always_on_top,
            get_image_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
