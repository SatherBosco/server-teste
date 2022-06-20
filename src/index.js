const express = require('express');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add Access Control Allow Origin headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization");
    next();
});

app.get('/', (req, res) => {
    return res.send({ msg: 'OK' });
});

require('./app/controllers/index')(app);

app.listen(3000);