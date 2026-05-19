import type { FileService, FileOpenResult } from '@jauto/file-io';
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
    return { name: result.name, content: result.content };
  }

  async saveFile(name: string, content: string): Promise<boolean> {
    const result = await invoke<string | false>('save_file', {
      content,
      default_name: name,
    });
    return result !== false;
  }

  async exportImage(blob: Blob, name: string): Promise<boolean> {
    const buffer = await blob.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buffer));
    return invoke<boolean>('export_image', {
      bytes,
      default_name: name,
    });
  }
}
