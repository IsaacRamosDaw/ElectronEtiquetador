import { app, BrowserWindow, ipcMain } from 'electron';
import { getModelsList} from './main/launcher.js';
import { saveModel, getModel, getModelToEdit } from './main/createModel.js';
import { prepareText, getJsonData, saveCurrentProgress } from './main/tagger.js';

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

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) 
    { mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);} 
  else 
    { mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));}

  mainWindow.webContents.openDevTools();
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


// ! Launcher view
// * Lectura de archivos json en la carpeta models
ipcMain.handle('getAllModels', async () => {
  return getModelsList();
});

// ! CreateModel View
// * Obtener modelo
ipcMain.handle('getModel', async (_event, modelName) => {
  return getModel(modelName);
});

// * Obtener modelo a editar
ipcMain.handle('getModelToEdit', async (_event, modelName) => {
  return getModelToEdit(modelName);
});

// * Guardar modelo
ipcMain.handle('saveModel', async (_event, modelData) => {
  return saveModel(modelData);
});

// ! Tagger View
// * Crear el json del texto
ipcMain.handle('prepareText', async (_event, fileName, textContent) => {
  return prepareText(fileName, textContent);
});

// * Obtener json
ipcMain.handle('getJsonData', async (_event, fileName) => {
  return getJsonData(fileName);
});

// * Guardar progreso
ipcMain.handle('saveCurrentProgress', async (_event, fileName, data) => {
  return saveCurrentProgress(fileName, data);
});