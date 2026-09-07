import type { FileService, FileOpenResult, FileSaveResult } from '@jauto/file-io';
import { invoke } from '@tauri-apps/api/core';

type NativeOpenResult = {
  name: string;
  content: string;
  path: string;
};

export class DesktopFileService implements FileService {
  async openFile(): Promise<FileOpenResult | null> {
    const result = await invoke<NativeOpenResult | null>('open_file');
    if (!result) return null;
    return { name: result.name, content: result.content, path: result.path };
  }

  async saveFile(name: string, content: string, path?: string): Promise<FileSaveResult | null> {
    return invoke<FileSaveResult | null>('save_file', {
      content,
      defaultName: name,
      currentPath: path ?? null,
    });
  }

  async exportImage(blob: Blob, name: string): Promise<boolean> {
    const buffer = await blob.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buffer));
    return invoke<boolean>('export_image', {
      bytes,
      defaultName: name,
    });
  }
}
