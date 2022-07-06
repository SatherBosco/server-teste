require("dotenv").config();

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const Account = require('../models/Account');
const Payment = require('../models/Payment');

const router = express.Router();

router.use(authMiddleware);

router.post('/saque', async(req, res) => {
    try {
        return res.send({ msg: 'OK' });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro ao verificar seus registros no resort.' });
    }
});

router.post('/deposito', async(req, res) => {
    const pay = req.body;
    try {
        const { paymentid } = await Payment.findOne({}).sort({ 'paymentid': -1 }).limit(1);
        pay.paymentid = paymentid + 1;
        pay.user = req.userId;

        const payment = await Payment.create(pay);


        return res.send({ msg: 'OK', payment });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor.' });
    }
});

module.exports = app => app.use('/payment', router);