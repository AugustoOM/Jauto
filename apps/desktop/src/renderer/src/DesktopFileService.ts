import type { FileService, FileOpenResult } from '@jauto/file-io';

export class DesktopFileService implements FileService {
  async openFile(): Promise<FileOpenResult | null> {
    const result = await window.electronAPI.openFile();
    if (!result) return null;
    return { name: result.name, content: result.content };
  }

  async saveFile(name: string, content: string): Promise<boolean> {
    const result = await window.electronAPI.saveFile(content, name);
    return result !== false;
  }

  async exportImage(blob: Blob, name: string): Promise<boolean> {
    const buffer = await blob.arrayBuffer();
    return window.electronAPI.exportImage(buffer, name);
  }
}
