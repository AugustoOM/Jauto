import { Menu, BrowserWindow } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';

export function buildMenu(): void {
  const isMac = process.platform === 'darwin';

  function sendToRenderer(channel: string) {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.send(channel);
  }

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'Jauto',
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'New DFA/NFA', accelerator: 'CmdOrCtrl+N', click: () => sendToRenderer('menu:new-fa') },
        { label: 'New PDA', click: () => sendToRenderer('menu:new-pda') },
        { label: 'New Turing Machine', click: () => sendToRenderer('menu:new-tm') },
        { type: 'separator' },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => sendToRenderer('menu:open') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+S', click: () => sendToRenderer('menu:save') },
        { type: 'separator' },
        { label: 'Export PNG...', click: () => sendToRenderer('menu:export-png') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => sendToRenderer('menu:undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => sendToRenderer('menu:redo') },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Jauto',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: 'About Jauto',
              message: 'Jauto v0.1.0',
              detail: 'A modern, open-source replacement for JFLAP 7.1.\nhttps://github.com/jauto',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
