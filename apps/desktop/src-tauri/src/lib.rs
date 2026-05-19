use serde::Serialize;
use std::{fs, path::Path};
use tauri::{
    menu::{MenuBuilder, MenuItem, SubmenuBuilder},
    Emitter,
};

#[derive(Serialize)]
struct FileOpenResult {
    name: String,
    content: String,
    path: String,
}

#[tauri::command]
async fn open_file() -> Result<Option<FileOpenResult>, String> {
    let Some(file) = rfd::AsyncFileDialog::new()
        .add_filter("JFLAP Files", &["jff"])
        .pick_file()
        .await
    else {
        return Ok(None);
    };

    let path = file.path().to_path_buf();
    let content = fs::read_to_string(&path).map_err(|err| err.to_string())?;

    Ok(Some(FileOpenResult {
        name: file_name(&path, "unknown.jff"),
        content,
        path: path.to_string_lossy().into_owned(),
    }))
}

#[tauri::command]
async fn save_file(content: String, default_name: String) -> Result<Option<String>, String> {
    let Some(file) = rfd::AsyncFileDialog::new()
        .add_filter("JFLAP Files", &["jff"])
        .set_file_name(&default_name)
        .save_file()
        .await
    else {
        return Ok(None);
    };

    let path = file.path().to_path_buf();
    fs::write(&path, content).map_err(|err| err.to_string())?;
    Ok(Some(file_name(&path, &default_name)))
}

#[tauri::command]
async fn export_image(bytes: Vec<u8>, default_name: String) -> Result<bool, String> {
    let Some(file) = rfd::AsyncFileDialog::new()
        .add_filter("PNG Image", &["png"])
        .set_file_name(&default_name)
        .save_file()
        .await
    else {
        return Ok(false);
    };

    fs::write(file.path(), bytes).map_err(|err| err.to_string())?;
    Ok(true)
}

fn file_name(path: &Path, fallback: &str) -> String {
    path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(fallback)
        .to_string()
}

fn build_menu(app: &mut tauri::App) -> tauri::Result<()> {
    let new_fa = MenuItem::with_id(app, "menu:new-fa", "New DFA/NFA", true, Some("CmdOrCtrl+N"))?;
    let new_pda =
        MenuItem::with_id(app, "menu:new-pda", "New PDA", true, Some("CmdOrCtrl+Shift+N"))?;
    let new_tm = MenuItem::with_id(
        app,
        "menu:new-tm",
        "New Turing Machine",
        true,
        Some("CmdOrCtrl+Alt+N"),
    )?;
    let open = MenuItem::with_id(app, "menu:open", "Open...", true, Some("CmdOrCtrl+O"))?;
    let save = MenuItem::with_id(app, "menu:save", "Save As...", true, Some("CmdOrCtrl+S"))?;
    let export_png = MenuItem::with_id(app, "menu:export-png", "Export PNG...", true, None::<&str>)?;
    let undo = MenuItem::with_id(app, "menu:undo", "Undo", true, Some("CmdOrCtrl+Z"))?;
    let redo = MenuItem::with_id(app, "menu:redo", "Redo", true, Some("CmdOrCtrl+Shift+Z"))?;

    let app_menu = SubmenuBuilder::new(app, "Jauto")
        .about(None)
        .separator()
        .quit()
        .build()?;
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_fa)
        .item(&new_pda)
        .item(&new_tm)
        .separator()
        .item(&open)
        .item(&save)
        .separator()
        .item(&export_png)
        .separator()
        .quit()
        .build()?;
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&undo)
        .item(&redo)
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
    let view_menu = SubmenuBuilder::new(app, "View")
        .reload()
        .separator()
        .fullscreen()
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu, &edit_menu, &view_menu])
        .build()?;
    app.set_menu(menu)?;

    app.on_menu_event(|app_handle, event| {
        let id = event.id().0.as_str();
        if id.starts_with("menu:") {
            let _ = app_handle.emit("menu-command", id);
        }
    });

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            build_menu(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_file, save_file, export_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
