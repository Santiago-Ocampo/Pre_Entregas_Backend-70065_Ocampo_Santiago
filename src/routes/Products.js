import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const productsFilePath = path.join(__dirname, '../data/products.json');

// Leer archivo de productos
const readProductsFile = () => {
  if (!fs.existsSync(productsFilePath)) {
    fs.writeFileSync(productsFilePath, '[]');
  }
  const data = fs.readFileSync(productsFilePath, 'utf8');
  return JSON.parse(data);
};

// Escribir en archivo de productos
const writeProductsFile = (data) => {
  fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2));
};

// Listar todos los productos
router.get('/', (req, res) => {
  const products = readProductsFile();
  let { limit } = req.query;
  limit = limit ? parseInt(limit) : products.length;
  res.json(products.slice(0, limit));
});

// Obtener producto por ID
router.get('/:pid', (req, res) => {
  const products = readProductsFile();
  const product = products.find(p => p.id === parseInt(req.params.pid));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

// Agregar un nuevo producto
router.post('/', (req, res) => {
  const products = readProductsFile();
  const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body
  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios, excepto thumbnails' })
  }

  const newProduct = {
    id: Date.now().toString(),
    title,
    description,
    code,
    price,
    status,
    stock,
    category,
    thumbnails
  };

  products.push(newProduct)
  writeProductsFile(products)
  res.status(201).json(newProduct)
});

// Actualizar un producto
router.put('/:pid', (req, res) => {
  const products = readProductsFile()
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.pid));
  if (productIndex !== -1) {
    const updatedProduct = { ...products[productIndex], ...req.body, id: products[productIndex].id };
    products[productIndex] = updatedProduct
    writeProductsFile(products)
    res.json(updatedProduct)
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

// Eliminar un producto
router.delete('/:pid', (req, res) => {
  let products = readProductsFile()
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.pid));
  if (productIndex !== -1) {
    products = products.filter(p => p.id !== parseInt(req.params.pid));
    writeProductsFile(products)
    res.status(204).send()
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

export default router;
