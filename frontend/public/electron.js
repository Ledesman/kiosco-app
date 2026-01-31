import { app, BrowserWindow } from 'electron';
// eslint-disable-next-line no-undef
const path = require('path');
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  //win.loadURL('http://localhost:6969'); // Asegúrate de que este puerto coincida con el de Vite

  win.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // eslint-disable-next-line no-undef
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});