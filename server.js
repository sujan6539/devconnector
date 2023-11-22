const express = require("express");
const connectDB = require('./config/db');

// Connect to DB
const app = express();
connectDB()

app.get("/", (req, res) => res.send("testing app get"));

// define the middleware
app.use(express.json())

// define the route
app.use('/api/users', require('./router/api/Users'))
app.use('/api/posts', require('./router/api/Post'))
app.use('/api/profile', require('./router/api/Profile'))
app.use('/api/auth', require('./router/api/Auth'))

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Currently running port : ${PORT}`));
