import express from 'express'
import fs from 'fs';
import __dirname from '../utils.js'
import path from 'path';

// Cargar datos de productos desde el archivo
const loadData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (err) {
        return []
    }
};

let products = loadData(path.join(__dirname, 'data/products.json'))

const router = express.Router()

router.get('/', (req, res) => {
    products = loadData(path.join(__dirname, 'data/products.json'))
    res.render('home', { products, })
})

router.get('/realtimeproducts', (req, res) => {
    products = loadData(path.join(__dirname, 'data/products.json'));
    res.render('realTimeProducts', { products, title: "Productos en Tiempo Real" });
});

export default router;