const express = require('express');
const https = require('https');
const fs = request('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

require('./app/controllers/index')(app);

https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
}, app).listen(3333);