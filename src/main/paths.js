import path from 'path';
import fs from 'fs';

import { app } from 'electron';

//* Ruta base de los datos ("%appdata%/etiquetador-data")
const getBaseDataPath = () => {
  const userDataPath = app.getPath('userData');
  const dataPath = path.join(userDataPath, 'etiquetador-data');

  if (!fs.existsSync(dataPath)) { fs.mkdirSync(dataPath, { recursive: true }); }

  return dataPath;
};

//* Ruta de los modelos ("%appdata%/etiquetador-data/models")
export const getModelsPath = () => {
  const modelsPath = path.join(getBaseDataPath(), 'models');
  if (!fs.existsSync(modelsPath)) {
    fs.mkdirSync(modelsPath, { recursive: true });
  }
  return modelsPath;
};

//* Ruta de los datos de las sesiones ("%appdata%/etiquetador-data/data")
export const getDataPath = () => {
  const sessionDataPath = path.join(getBaseDataPath(), 'data');
  if (!fs.existsSync(sessionDataPath)) { fs.mkdirSync(sessionDataPath, { recursive: true }); }
  return sessionDataPath;
};

//* Ruta de las transcripciones ("%appdata%/etiquetador-data/transcriptions")
export const getTranscriptionsPath = () => {
  const transcriptionsPath = path.join(getBaseDataPath(), 'transcriptions');
  if (!fs.existsSync(transcriptionsPath)) { fs.mkdirSync(transcriptionsPath, { recursive: true }); }
  return transcriptionsPath;
};
