import express from 'express';
import Product from '../models/Products.model.js';
import Cart from '../models/Carts.model.js';

const router = express.Router();

// Ruta para crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const { title, description, price, thumbnail, code, stock } = req.body;
    const newProduct = new Product({ title, description, price, thumbnail, code, stock });
    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ error: 'Error creating product', details: error.message });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  const { limit = 10, page = 1, sort, query } = req.query;

  // Validación y parsing de los parámetros
  const parsedLimit = Math.max(parseInt(limit, 10), 1);
  const parsedPage = Math.max(parseInt(page, 10), 1);
  const sortOption = sort === 'asc' ? 1 : sort === 'desc' ? -1 : null;


  const filter = {};
  if (query) {
    filter.$or = [
      { category: new RegExp(query, 'i') },
      { status: query === 'true' ? true : query === 'false' ? false : undefined }
    ];
  }

  const options = {
    page: parsedPage,
    limit: parsedLimit,
    sort: sortOption ? { price: sortOption } : {},
    populate: 'category',
    lean: true
  };

  try {
    const products = await Product.paginate(filter, options);

    res.json({
      status: 'success',
      payload: products.docs,
      totalPages: products.totalPages,
      prevPage: products.hasPrevPage ? products.prevPage : null,
      nextPage: products.hasNextPage ? products.nextPage : null,
      page: products.page,
      hasPrevPage: products.hasPrevPage,
      hasNextPage: products.hasNextPage,
      prevLink: products.hasPrevPage ? `/api/products?limit=${limit}&page=${products.prevPage}&sort=${sort}&query=${query}` : null,
      nextLink: products.hasNextPage ? `/api/products?limit=${limit}&page=${products.nextPage}&sort=${sort}&query=${query}` : null,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


// POST /api/products/:pid/add-to-cart
router.post('/:pid/add-to-cart', async (req, res) => {
  try {
    const { pid } = req.params;
    const { quantity = 1 } = req.body;

    // Verifica si el producto existe
    const product = await Product.findById(pid);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }

    // Encuentra el carrito activo o crea uno nuevo
    let cart = await Cart.findOne({ status: 'active' });
    if (!cart) {
      cart = new Cart({ products: [], status: 'active' });
    }

    // Verifica si el producto ya está en el carrito
    const productInCart = cart.products.find(p => p.product.toString() === pid);
    if (productInCart) {
      productInCart.quantity += parseInt(quantity);
    } else {
      cart.products.push({ product: pid, quantity: parseInt(quantity) });
    }

    await cart.save();

    res.status(200).json({ status: 'success', message: 'Producto agregado al carrito', cart });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;