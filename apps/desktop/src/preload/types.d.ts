interface ElectronAPI {
  platform: string;
  openFile(): Promise<{ name: string; content: string; path: string } | null>;
  saveFile(content: string, defaultName: string): Promise<string | false>;
  exportImage(buffer: ArrayBuffer, defaultName: string): Promise<boolean>;
  onMenuCommand(callback: (command: string) => void): void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
