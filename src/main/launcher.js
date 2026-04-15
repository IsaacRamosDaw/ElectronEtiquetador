import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import { getModelsPath, getDataPath } from './paths.js';

//* Lista de proyectos (carpetas dentro de data)
export const getProjectsList = () => {
  const dataPath = getDataPath();

  if (!fs.existsSync(dataPath)) return [];

  // Devuelve un array sucio con todos los archivos
  return fs.readdirSync(dataPath).filter(file => {
    // Hacemos un filter para quedarnos solo con las carpetas
    return fs.statSync(path.join(dataPath, file)).isDirectory();
    // Devuleve un array de nombres de carpetas
  });
};

//* Crear un nuevo proyecto
export const createProject = (projectName) => {
  const projectPath = path.join(getDataPath(), projectName);

  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    return { success: true };
  }

  return { success: false, error: "El proyecto ya existe" };
};

//* Eliminar un proyecto
export const deleteProject = (projectName) => {
  const projectPath = path.join(getDataPath(), projectName);

  try {
    // Si existe la carpeta
    if (fs.existsSync(projectPath)) {
      // La elimina
      fs.rmSync(projectPath, { recursive: true, force: true });
      return { success: true };
    }

    return { success: false, error: "El proyecto no existe" };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

//* Lista de sesiones (JSON de transcripciones ya procesadas)
export const getSessionsList = (projectName = null) => {
  const dataPath = projectName ? path.join(getDataPath(), projectName) : getDataPath();
  if (!fs.existsSync(dataPath)) return [];
  return fs.readdirSync(dataPath).filter(file => file.endsWith('.json') && fs.statSync(path.join(dataPath, file)).isFile());
};

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

//* Importar sesión JSON (transcripción ya procesada)
export const importSession = async (mainWindow, projectName = null) => {
  const { getDataPath } = await import('./paths.js'); 
  const dataPath = projectName ? path.join(getDataPath(), projectName) : getDataPath();
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar sesión JSON',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  const sourcePath = filePaths[0];
  const fileName = path.basename(sourcePath);
  const destPath = path.join(dataPath, fileName);

  try {
    fs.copyFileSync(sourcePath, destPath);
    return { success: true, fileName };
  } catch (error) {
    console.error("Error importing session:", error);
    return { success: false, error: error.message };
  }
};
