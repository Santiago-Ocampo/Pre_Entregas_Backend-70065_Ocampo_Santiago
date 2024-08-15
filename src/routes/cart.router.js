import express from 'express';
import Cart from '../models/Carts.model.js';
import Product from '../models/Products.model.js';

const router = express.Router();

//devuelva los productos completos.
router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate('products.product');
        if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

        res.render('cartDetails', { cart });
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener el carrito', error: err.message });
    }
});

// Crear un nuevo carrito
router.post('/', async (req, res) => {
    try {
        const newCart = new Cart({ products: [] });
        await newCart.save();
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el carrito', error });
    }
});

// Ruta para agregar un producto al carrito
router.post('/add/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity = 1 } = req.body;

        // Validar que productId es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto no válido' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

        // Intentar encontrar un carrito existente
        let cart = await Cart.findOne(); // Puedes modificar esto para obtener un carrito específico
        if (!cart) {
            // Si no hay carrito, crear uno nuevo
            cart = new Cart();
        }

        // Verificar si el producto ya está en el carrito
        const existingProduct = cart.products.find(p => p.product.toString() === productId);
        if (existingProduct) {
            // Si el producto ya está en el carrito, aumentar la cantidad
            existingProduct.quantity += parseInt(quantity);
        } else {
            // Si el producto no está en el carrito, agregarlo
            cart.products.push({ product: productId, quantity: parseInt(quantity) });
        }

        await cart.save()

        const populatedCart = await cart.populate('products.product').execPopulate()

        res.status(201).json({ message: 'Producto agregado al carrito', cart })
    } catch (err) {
        res.status(500).json({ message: 'Error al agregar producto al carrito', error: err.message })
    }
});

// Ruta para eliminar un producto del carrito
router.post('/remove/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne(); // Modifica esto para obtener un carrito específico
        if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
        if (productIndex !== -1) {
            cart.products.splice(productIndex, 1);
            await cart.save();
            return res.status(200).json({ message: 'Producto eliminado del carrito', cart });
        }

        res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar producto del carrito', error: err.message });
    }
});

//Eliminar un producto específico de un carrito.
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const cart = await Cart.findById(cid);
        if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

        const productIndex = cart.products.findIndex(p => p.product.toString() === pid);
        if (productIndex === -1) return res.status(404).json({ message: 'Producto no encontrado en el carrito' });

        cart.products.splice(productIndex, 1);
        await cart.save();

        res.json({ message: 'Producto eliminado del carrito', cart });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar producto del carrito', error: err.message });
    }
});


//Eliminar todos los productos del carrito.
router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid);
        if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

        cart.products = [];
        await cart.save();

        res.json({ message: 'Todos los productos han sido eliminados del carrito', cart });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar los productos del carrito', error: err.message });
    }
});


//Actualizar el carrito con un arreglo de productos.
router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;

        const cart = await Cart.findById(cid);
        if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

        cart.products = products;
        await cart.save();

        res.json({ message: 'Carrito actualizado', cart });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar el carrito', error: err.message });
    }
});


//Actualizar solo la cantidad de un producto en el carrito.
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findById(cid);
        if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

        const productInCart = cart.products.find(p => p.product.toString() === pid);
        if (!productInCart) return res.status(404).json({ message: 'Producto no encontrado en el carrito' });

        productInCart.quantity = quantity;
        await cart.save();

        res.json({ message: 'Cantidad actualizada', cart });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar la cantidad', error: err.message });
    }
});

export default router;