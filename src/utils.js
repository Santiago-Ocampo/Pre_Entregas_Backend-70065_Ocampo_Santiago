// Aca van a estar integradas diferentes funcionalidades para exportar a diferentes directorios 
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default __dirname;