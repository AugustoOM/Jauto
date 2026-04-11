import { ipcMain, dialog, BrowserWindow } from 'electron';
import { readFile, writeFile } from 'fs/promises';

export function registerIpcHandlers(): void {
  ipcMain.handle('file:open', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'JFLAP Files', extensions: ['jff'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0]!;
    const content = await readFile(filePath, 'utf-8');
    return { name: filePath.split(/[\\/]/).pop() ?? 'unknown.jff', content, path: filePath };
  });

  ipcMain.handle('file:save', async (_event, args: { content: string; defaultName: string }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;

    const result = await dialog.showSaveDialog(win, {
      defaultPath: args.defaultName,
      filters: [{ name: 'JFLAP Files', extensions: ['jff'] }],
    });

    if (result.canceled || !result.filePath) return false;

    await writeFile(result.filePath, args.content, 'utf-8');
    return result.filePath.split(/[\\/]/).pop() ?? args.defaultName;
  });

  ipcMain.handle('file:export-image', async (_event, args: { buffer: ArrayBuffer; defaultName: string }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;

    const result = await dialog.showSaveDialog(win, {
      defaultPath: args.defaultName,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    });

    if (result.canceled || !result.filePath) return false;

    await writeFile(result.filePath, Buffer.from(args.buffer));
    return true;
  });
}
