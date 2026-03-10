import fs from 'fs';
import path from 'path';
import { getDataPath } from './paths.js';

export const prepareText = (fileName, textContent) => {
  if (!textContent) {
    throw new Error("El contenido del texto está vacío o no se recibió correctamente.");
  }

  const dataPath = getDataPath();
  const lines = textContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const structuredData = {};

  lines.forEach((line, index) => {
    const isInterviewer = line.trim().startsWith('E_');
    structuredData[index + 1] = {
      line: line.trim(),
      Interviewer: isInterviewer,
      attributes: [],
      categories: [],
      entities: []
    };
  });

  try {
    const jsonFileName = fileName.replace(/\.[^/.]+$/, "") + ".json";
    const filePath = path.join(dataPath, jsonFileName);
    
    fs.writeFileSync(filePath, JSON.stringify(structuredData, null, 2), 'utf-8');
    return { success: true, fileName: jsonFileName };
  } catch (error) {
    console.error("Error procesando sesión:", error);
    return { success: false, error: error.message };
  }
};

export const getJsonData = (fileName) => {
  const filePath = path.join(getDataPath(), `${fileName}.json`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  return null;
};

export const saveCurrentProgress = (fileName, data) => {
  const filePath = path.join(getDataPath(), `${fileName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true };
};

export const exportToHtml = (filePath, htmlContent) => {
  try {
    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error("Error exportando HTML:", error);
    return { success: false, error: error.message };
  }
};