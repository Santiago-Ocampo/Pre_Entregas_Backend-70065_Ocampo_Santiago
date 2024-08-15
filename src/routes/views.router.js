import express from 'express'
import __dirname from '../utils.js'
import Cart from '../models/Carts.model.js';
import Product from '../models/Products.model.js';


const router = express.Router();

// Ruta para la vista principal
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('home', { products });
    } catch (err) {
        res.status(500).json({ message: 'Error al cargar los productos', error: err.message });
    }
});

// Ruta para la vista de productos en tiempo real
router.get('/realtimeproducts', async (req, res) => {
    try {
        const products = await Product.find({});
        const cart = await Cart.findOne({ status: 'active' }).populate('products.product');
        res.render('realTimeProducts', { products, cart, title: "Productos en Tiempo Real" });
    } catch (err) {
        res.status(500).json({ message: 'Error al cargar los productos en tiempo real', error: err.message });
    }
});

// Ruta para la vista de detalles de productos
router.get('/products/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid);

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.render('productDetails', { product });
    } catch (err) {
        res.status(500).json({ message: 'Error al cargar el producto', error: err.message });
    }
});


// Ruta para la vista a carrito especifico
router.get('/carts/:cid', async (req, res) => {
    const cartId = req.params.cid;
    const cart = carts.find(c => c._id === cartId);

    if (cart) {
        // Aquí puedes hacer una consulta para obtener los productos por su ID en MongoDB si estás usando la base de datos.
        const productsInCart = cart.products.map(pid => products.find(p => p._id === pid));
        res.render('cartDetails', { cartId: cart._id, productsInCart });
    } else {
        res.status(404).send('Carrito no encontrado');
    }
});

export default router;