import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  platform: process.platform,

  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content: string, defaultName: string) =>
    ipcRenderer.invoke('file:save', { content, defaultName }),
  exportImage: (buffer: ArrayBuffer, defaultName: string) =>
    ipcRenderer.invoke('file:export-image', { buffer, defaultName }),

  onMenuCommand: (callback: (command: string) => void) => {
    const channels = [
      'menu:new-fa',
      'menu:new-pda',
      'menu:new-tm',
      'menu:open',
      'menu:save',
      'menu:export-png',
      'menu:undo',
      'menu:redo',
    ];
    for (const channel of channels) {
      ipcRenderer.on(channel, () => callback(channel));
    }
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
