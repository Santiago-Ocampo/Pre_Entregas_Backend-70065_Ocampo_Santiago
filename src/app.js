const express = require("express")

const app = express()
const PORT = 8080

// Middleware
app.use (express.json())

//Importar y usar los routers
const productsRouter = require ('./routes/Products')
const cartsRouter = require ('./routes/Carts')

//las rutas base para los routers.
app.use('/api/products', productsRouter)
app.use('/api/carts',cartsRouter)

// Iniciar el servidor
app.listen(PORT,() => 
    {console.log('Server listening on http://localhost: 8080')
})