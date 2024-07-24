import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const cartsFilePath = path.join(__dirname, '../data/carts.json');

// Leer archivo de carritos
const readCartsFile = () => {
  if (!fs.existsSync(cartsFilePath)) {
    fs.writeFileSync(cartsFilePath, '[]');
  }
  const data = fs.readFileSync(cartsFilePath, 'utf8');
  return JSON.parse(data);
};

// Escribir en archivo de carritos
const writeCartsFile = (data) => {
  fs.writeFileSync(cartsFilePath, JSON.stringify(data, null, 2));
};

// Crear un nuevo carrito
router.post('/', (req, res) => {
  const carts = readCartsFile();
  const newCart = {
    id: carts.length > 0 ? carts[carts.length - 1].id + 1 : 1,
    products: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active'
  };

  carts.push(newCart);
  writeCartsFile(carts);
  res.status(201).json(newCart);
});

// Obtener carrito por ID
router.get('/:cid', (req, res) => {
  const carts = readCartsFile();
  const cart = carts.find(c => c.id === parseInt(req.params.cid));
  if (cart) {
    res.json(cart);
  } else {
    res.status(404).json({ message: 'Carrito no encontrado' });
  }
});

// Agregar producto al carrito
router.post('/:cid/product/:pid', (req, res) => {
  const carts = readCartsFile();
  const cartIndex = carts.findIndex(c => c.id === parseInt(req.params.cid));
  if (cartIndex !== -1) {
    const cart = carts[cartIndex];
    const productIndex = cart.products.findIndex(p => p.product === parseInt(req.params.pid));
    if (productIndex !== -1) {
      cart.products[productIndex].quantity += 1;
    } else {
      cart.products.push({ product: parseInt(req.params.pid), quantity: 1 });
    }
    cart.updatedAt = new Date().toISOString();
    writeCartsFile(carts);
    res.json(cart);
  } else {
    res.status(404).json({ message: 'Carrito no encontrado' });
  }
});

export default router;
