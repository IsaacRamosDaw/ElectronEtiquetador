import { app, BrowserWindow, ipcMain, dialog } from 'electron';

import { getModelsList, importModel, importSession, getSessionsList } from './main/launcher.js';
import { saveModel, getModel, getModelToEdit, deleteModel } from './main/createModel.js';
import { prepareText, getJsonData, saveCurrentProgress, exportToHtml, exportToJson } from './main/tagger.js';

import path from 'node:path';
import started from 'electron-squirrel-startup';

if (started) { app.quit(); }

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) { mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL); }
  else { mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)); }

  //? Abrir la consola del dev
  // mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

//! Launcher view
ipcMain.handle('getAllModels', async () => { return getModelsList(); });

ipcMain.handle('getAllSessions', async () => { return getSessionsList(); });

ipcMain.handle('importModel', async () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  return importModel(mainWindow);
});

ipcMain.handle('deleteModel', async (_event, modelName) => {
  return deleteModel(modelName);
});

ipcMain.handle('importSession', async () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  return importSession(mainWindow);
});

//! CreateModel View
ipcMain.handle('getModel', async (_event, modelName) => {
  return getModel(modelName);
});

ipcMain.handle('getModelToEdit', async (_event, modelName) => {
  return getModelToEdit(modelName);
});

ipcMain.handle('saveModel', async (_event, modelData) => {
  return saveModel(modelData);
});

//! Tagger View
ipcMain.handle('prepareText', async (_event, fileName, textContent) => {
  return prepareText(fileName, textContent);
});

ipcMain.handle('getJsonData', async (_event, fileName) => {
  return getJsonData(fileName);
});

ipcMain.handle('saveCurrentProgress', async (_event, fileName, data) => {
  return saveCurrentProgress(fileName, data);
});

ipcMain.handle('exportToHtml', async (_event, fileName, htmlContent) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar Sesión a HTML',
    defaultPath: fileName.replace(/\.[^/.]+$/, "") + "_export.html",
    filters: [
      { name: 'Páginas Web', extensions: ['html'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, error: 'Exportación cancelada', canceled: true };
  }

  return exportToHtml(filePath, htmlContent);
});

ipcMain.handle('exportToTxt', async (_event, fileName, txtContent) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar Sesión a TXT',
    defaultPath: fileName.replace(/\.[^/.]+$/, "") + "_export.txt",
    filters: [
      { name: 'Archivos de Texto', extensions: ['txt'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, error: 'Exportación cancelada', canceled: true };
  }

  return exportToHtml(filePath, txtContent);
});

ipcMain.handle('exportToJson', async (_event, fileName, data) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar Sesión a JSON',
    defaultPath: fileName, // fileName ya incluye el .json en el TaggerView
    filters: [
      { name: 'Archivos JSON', extensions: ['json'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, error: 'Exportación cancelada', canceled: true };
  }

  return exportToJson(filePath, data);
});