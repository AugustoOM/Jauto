import type { FileService, FileOpenResult } from './file-service';

export class WebFileService implements FileService {
  async openFile(): Promise<FileOpenResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.jff';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({ name: file.name, content: reader.result as string });
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  async saveFile(name: string, content: string): Promise<boolean> {
    try {
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name.endsWith('.jff') ? name : `${name}.jff`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }

  async exportImage(blob: Blob, name: string): Promise<boolean> {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }
}
