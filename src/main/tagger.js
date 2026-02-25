import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const prepareText = (fileName, textContent) => {
  if (!textContent) {
    throw new Error("El contenido del texto está vacío o no se recibió correctamente.");
  }

  // Usar una expresión regular para detectar cualquier tipo de salto de línea
  const dataPath = path.join(__dirname, '../../', 'src/data');

  // Usar una expresión regular para detectar cualquier tipo de salto de línea
  const lines = textContent.split(/\r?\n/).filter(line => line.trim() !== '');

  const structuredData = {};

  lines.forEach((line, index) => {
    // Identificamos si empieza por E_ (Entrevistador)
    const isInterviewer = line.trim().startsWith('E_');

    structuredData[index + 1] = {
      line: line.trim(),
      Interviewer: isInterviewer, // He corregido el typo a "Interviewer" pero puedes dejarlo como "Entrevister" si prefieres
      attributes: [],
      categories: []
    };
  });

  try {
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    // Guardamos el JSON con el mismo nombre que el archivo de texto
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
  const filePath = path.join(__dirname, '../../', 'src/data', `${fileName}.json`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  return null;
};

// En tagger.js añadir:
export const saveCurrentProgress = (fileName, data) => {
  const filePath = path.join(__dirname, '../../', 'src/data', `${fileName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true };
};