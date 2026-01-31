import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // En desarrollo, carga desde el servidor de Vite
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV === 'development') {
    win.loadURL(url.format({
      pathname: 'http://localhost:6969',
      protocol: 'http:',
      slashes: true
    }));
    // Abre las herramientas de desarrollo
    win.webContents.openDevTools();
  } else {
    // En producción, carga el archivo construido
    // eslint-disable-next-line no-undef
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // eslint-disable-next-line no-undef
  if (process.platform !== 'darwin') {
    app.quit();
  }
});