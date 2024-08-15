import express from 'express';
import mongoose from 'mongoose';
import handlebars from 'express-handlebars';
import __dirname from './utils.js';
import path from 'path';
import productsRouter from "./routes/products.router.js";
import cartsRouter from './routes/cart.router.js';
import viewsRouter from './routes/views.router.js';
import { Server } from 'socket.io';
import Product from './models/Products.model.js';
import Cart from './models/Carts.model.js';

const app = express();
const PORT = 8080;

// Conexión a MongoDB
mongoose.connect('mongodb+srv://santiago_ocampo:39716937@cluster0.sojq12q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Conectado a la base de datos de MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Configurar handlebars
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', viewsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Iniciando el servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});

// Configuración de Socket.IO
const io = new Server(server);

// Socket.io conexión
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Cargar productos desde la base de datos y enviarlos al cliente
  Product.find().then(products => {
    socket.emit('update-products', products);
  }).catch(err => console.error('Error al cargar productos:', err));


  // Manejar la creación de un nuevo producto
  socket.on('new-product', async (productData) => {
    try {
      const product = new Product(productData);
      await product.save();
      const products = await Product.find();
      io.emit('update-products', products);  // Emitir a todos los clientes
      socket.emit('new-product-success');
    } catch (err) {
      console.error('Error al crear producto:', err);
    }
  });

  // Manejar la eliminación de un producto
  socket.on('delete-product', async (productId) => {
    try {
      await Product.findByIdAndDelete(productId);
      const products = await Product.find();
      io.emit('update-products', products);  // Emitir a todos los clientes
      socket.emit('delete-success');
    } catch (err) {
      console.error('Error al eliminar producto:', err);
    }
  });

  // Escuchar la adición de un producto al carrito
  socket.on('add-to-cart', async ({ cartId, productId, quantity }) => {
    try {
      // Verificar si el cartId es válido, si no, crear un nuevo carrito
      if (!cartId || cartId === '' || !mongoose.Types.ObjectId.isValid(cartId)) {
        let existingCart = await Cart.findOne();
        if (!existingCart) {
          existingCart = new Cart();
          await existingCart.save();
        }
        cartId = existingCart._id.toString(); // Actualizar cartId con el ID del carrito existente o nuevo
      }

      // Buscar el carrito por el cartId
      let cart = await Cart.findById(cartId)

      // Buscar si el producto ya está en el carrito
      const existingProduct = cart.products.find(p => p.product.toString() === productId);
      if (existingProduct) {
        // Si el producto ya está en el carrito, incrementar la cantidad
        existingProduct.quantity += quantity;
      } else {
        // Si no, agregar el producto al carrito
        cart.products.push({ product: productId, quantity });
      }
      // Guardar los cambios en el carrito
      await cart.save();

      // Obtener el carrito actualizado y emitirlo
      const updatedCart = await Cart.findById(cartId).populate('products.product');
      io.emit('update-cart', updatedCart);
    } catch (err) {
      console.error('Error al agregar producto al carrito:', err.message);
    }
  });


  // Escuchar la eliminación de un producto del carrito
  socket.on('remove-from-cart', async ({ cartId, productId }) => {
    try {
      // Verificar si el cartId es válido, si no, obtener el carrito existente
      if (!cartId || cartId === '' || !mongoose.Types.ObjectId.isValid(cartId)) {
        const existingCart = await Cart.findOne();
        if (!existingCart) {
          throw new Error('ID de carrito no válido');
        }
        cartId = existingCart._id.toString(); // Usar el ID del carrito existente
      }

      // Buscar el carrito por el cartId
      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      // Filtrar los productos que no sean el que se quiere eliminar
      cart.products = cart.products.filter(p => p.product.toString() !== productId);

      // Guardar los cambios en el carrito
      await cart.save();

      // Obtener el carrito actualizado y emitirlo
      const updatedCart = await Cart.findById(cartId).populate('products.product');
      io.emit('update-cart', updatedCart);
    } catch (err) {
      console.error('Error al eliminar producto del carrito:', err.message);
    }
  });

  // Escuchar la creación de un nuevo carrito
  socket.on('create-cart', async () => {
    try {
      const newCart = new Cart();
      await newCart.save();
      const carts = await Cart.find();
      io.emit('cart-created', newCart);  // Emitir a todos los clientes
    } catch (err) {
      console.error('Error al crear carrito:', err);
    }
  });

  // Escuchar la eliminación de un carrito
  socket.on('delete-cart', async (cartId) => {
    try {
      // Verificar si el cartId es válido
      if (!cartId || cartId === '' || !mongoose.Types.ObjectId.isValid(cartId)) {
        console.error('ID de carrito no válido');
        return;
      }

      // Eliminar el carrito de la base de datos
      await Cart.findByIdAndDelete(cartId);

      // Emitir un evento para actualizar la vista del carrito en tiempo real
      io.emit('cart-deleted', cartId);
    } catch (err) {
      console.error('Error al eliminar el carrito:', err.message);
    }
  });

  // Manejar la desconexión del cliente
  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});
