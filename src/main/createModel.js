import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const saveModel = (modelData) => {
  const modelsPath = path.join(__dirname, '../../', 'src/models');
  let { fileName, data } = modelData;

  // Limpia el .json del nombre antes de añadirlo manualmente
  const cleanName = fileName.replace(/\.json$/, "");
  const filePath = path.join(modelsPath, `${cleanName}.json`);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Devolvemos el nombre limpio para confirmar
    return { success: true, fileName: `${cleanName}.json` };
  } catch (error) {
    console.error("Error saving model:", error);
    return { success: false, error: error.message };
  }
};

export const getModel = (modelName) => {
  const modelsPath = path.join(__dirname, '../../', 'src/models');
  const filePath = path.join(modelsPath, `${modelName}.json`);

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error("Error reading model:", error);
    return { success: false, error: error.message };
  }
};

export const getModelToEdit = (modelName) => {
  const modelsPath = path.join(__dirname, '../../', 'src/models');
  const filePath = path.join(modelsPath, `${modelName}.json`);

  console.log(filePath);

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error("Error reading model:", error);
    return { success: false, error: error.message };
  }
};
