import { contextBridge } from 'electron';

const electronAPI = {
  platform: process.platform,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
