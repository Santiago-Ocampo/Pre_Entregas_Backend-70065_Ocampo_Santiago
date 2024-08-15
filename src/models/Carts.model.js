import mongoose from 'mongoose';

// Definir el esquema de carritos
const cartSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, default: 1 }
    }
  ]
});

// Crear el modelo de carritos
const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
