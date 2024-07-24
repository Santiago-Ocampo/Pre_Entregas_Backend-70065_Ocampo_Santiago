import express from 'express';
import productsRouter from './routes/products.js';
import cartsRouter from './routes/carts.js';
import handlebars from 'express-handlebars';
import __dirname from './utils.js'
import viewsRouter from './routes/views.router.js'
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//configurar handlebars para leer el contenido de los endpoints
app.engine('handlebars', handlebars.engine())
app.set('views', __dirname + '/views')
app.set('view engine', 'handlebars')

//recursos estaticos
app.use(express.static((__dirname + '/public')))

// Usar los routers
app.use('/api/products', productsRouter)
app.use('/api/carts', cartsRouter)
app.use('/', viewsRouter)

//Cargar datos de productos y carritos desde los archivos
const loadData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const products = JSON.parse(data);

        // Asignar un ID único a cada producto si no tiene uno
        products.forEach(product => {
            if (!product.id) {
                product.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }
        })
        return

    } catch (err) {
        console.error(`Error al cargar datos desde ${filePath}:`, err)
        return []
    }
}



let products = loadData(path.join(__dirname, 'data/products.json'))
//console.log('Productos cargados al iniciar:', products); // Log de productos cargados al iniciar


// Guardar datos en los archivos
const saveData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// Iniciar el servidor
const httpServer = app.listen(8080, () => console.log(`server listening ready to operate on ${PORT}`))

// Configurador de Socket
const socketServer = new Server(httpServer)

socketServer.on('connection', (socket) => {
    console.log('Nuevo cliente conectado')

    // Enviar la lista de productos al cliente al conectarse
    socket.emit('update-products', products)

    // Manejar la creación de un nuevo producto
    socket.on('new-product', (product) => {
        if (!products) products = []
        product.id = Date.now().toString() // Asegurar que cada producto tiene un id único
        products.push(product)
        saveData(path.join(__dirname, 'data/products.json'), products)
        socketServer.emit('update-products', products)
    })

    // Manejar la eliminación de un producto
    socket.on('delete-product', (productId) => {
        if (products) {
            products = products.filter((product) => product.id !== productId)
            saveData(path.join(__dirname, 'data/products.json'), products)
            socketServer.emit('update-products', products)
            socket.emit('delete-success')
        }
    })
})
