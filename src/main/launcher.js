import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ! Lectura de archivos json en carpeta models
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ! Lectura de archivos json en carpeta models
export const getModelsList = () => {
  const modelsPath = path.join(__dirname, '../../', 'src/models');
  console.log("PATH");
  console.log(modelsPath);

  if (!fs.existsSync(modelsPath)) {
    fs.mkdirSync(modelsPath, { recursive: true });
  }

  return fs.readdirSync(modelsPath).filter(file => file.endsWith('.json'));
};

