import fs from 'fs';
import path from 'path';

import { dialog } from 'electron';
import { getModelsPath } from './paths.js';

//* Lista de modelos para elegir
export const getModelsList = () => {
  const modelsPath = getModelsPath();

  //? Filtra los archivos que sean .json
  return fs.readdirSync(modelsPath).filter(file => file.endsWith('.json'));
};

//* Importar modelo
export const importModel = async (mainWindow) => {
  const modelsPath = getModelsPath();

  //? Abre el diálogo para seleccionar un archivo JSON
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar modelo JSON',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });

  //? Si se cancela o no se selecciona ningún archivo
  if (canceled || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  //? Copia el archivo seleccionado a la carpeta de modelos
  const sourcePath = filePaths[0];
  const fileName = path.basename(sourcePath);
  const destPath = path.join(modelsPath, fileName);

  //? Intenta copiar el archivo
  try {
    fs.copyFileSync(sourcePath, destPath);
    return { success: true, fileName };
  } catch (error) {
    console.error("Error importing model:", error);
    return { success: false, error: error.message };
  }
};
