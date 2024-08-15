import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Definir el esquema de productos
const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    thumbnail: { type: String },
    customId: {
        type: String,
        unique: true,
        default: function () {
            return this._id ? this._id.toString() : null;
        },
    },
    code: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `PROD-${Date.now()}`;//valor predeterminado para el campo code
        }
    }
});

productSchema.pre('save', function (next) {
    if (!this.customId) {
        this.customId = new mongoose.Types.ObjectId().toString();
    }
    next();
});

// Aplicar el plugin de paginación
productSchema.plugin(mongoosePaginate);

// Crear el modelo de productos
const Product = mongoose.model('Product', productSchema);

export default Product;
