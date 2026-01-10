const express = require('express');
const app = express();
const mongoose = require("mongoose");
require('dotenv').config();
const config = require("./src/config/config")
const port = config.PORT
const mongodb_url = config.MONGODB_URL
const cors = require('cors');
const { testSupabaseConnection } = require("./src/config/supabase");

testSupabaseConnection();

app.use(cors({
    origin: [
        "http://localhost:8100"
    ],
    Credential: true
}));

app.use(express.json())

app.listen(port, () =>{
    console.log(`Server is listening at http://localhost:${port}`)
});

app.get('/', (req, res) => {
    res.send("API start working!")
})

mongoose.connect(mongodb_url).then(() => {
    console.log("MongoDB is successfully connected!")
})