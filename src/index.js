const express = require('express');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add Access Control Allow Origin headers
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

require('./app/controllers/index')(app);

app.listen(3333);