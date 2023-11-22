const express = require("express");

const app = express();

app.get("/", (req, res) => res.send("testing app get"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Currently running port : ${PORT}`));
