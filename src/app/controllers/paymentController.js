require("dotenv").config();

const ethers = require('ethers');
const SmartContractSaque = require('../contracts/SaquePayment.json');

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const Account = require('../models/Account');
const Payment = require('../models/Payment');
const Saque = require('../models/Saque');

const router = express.Router();

router.use(authMiddleware);

router.post('/saque', async(req, res) => {
    const saq = req.body;
    try {
        let saque;
        let sigMessage;
        let _date;
        const { saqueid } = await Saque.findOne({}).sort({ 'saqueid': -1 }).limit(1);
        const account = await Account.findOne({ user: req.userId });
        if (saq.bone < 400)
            return res.status(400).send({ msg: 'Saque mínimo de 400 Bone.' });
        if (account.bone - saq.bone < 100)
            return res.status(400).send({ msg: 'É necessário deixar no mínimo 100 Bone na conta.' });

        const saqueDate = await Saque.findOne({ user: req.userId }).sort({ 'createdAt': -1 }).limit(1);

        if (saqueDate !== null) {
            if ((new Date(saqueDate.createdAt).getTime() + 48 * 3600000) > new Date().getTime()) {
                if (saqueDate.paid)
                    return res.status(400).send({ msg: 'Saque disponivel apenas 48 horas após o ultimo.' });
                else {
                    saque = saqueDate;
                    sigMessage = saqueDate.signature;
                    _date = saqueDate.date;
                    return res.send({ msg: 'OK', saque, sigMessage, _date });
                }
            }
        }

        saq.saqueid = saqueid + 1;
        saq.user = req.userId;

        const NODE_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
        const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

        const SmartContractSaqueObj = new ethers.Contract(
            '0x381DB123d45a52b756Caa001DE20bd9770BaC70A',
            SmartContractSaque,
            provider
        );

        const _receipt = saq.wallet.toString();
        const _amount = ethers.utils.parseEther(saq.bone);
        const _nonce = parseInt(saq.saqueid);
        _date = parseInt(new Date().getTime() / 1000 + 172800);

        const _contract = '0x381DB123d45a52b756Caa001DE20bd9770BaC70A';

        let saqueTransaction = await SmartContractSaqueObj.getMessage(
            _receipt,
            _amount,
            _nonce,
            _date,
            _contract
        );

        const PRIV_KEY = '0xd209f0a532283abb0a3b05396a38a3edf379400100b28717602950fe43a90a27';
        const signer = new ethers.Wallet(PRIV_KEY);

        sigMessage = await signer.signMessage(ethers.utils.arrayify(saqueTransaction));

        saq.signature = sigMessage;
        saq.date = _date;
        saque = await Saque.create(saq);

        return res.send({ msg: 'OK', saque, sigMessage, _date });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor.' });
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

// router.post('/teste', async(req, res) => {
//     var obj = {
//         'saqueid': 0,
//         'itemid': "",
//         'paid': true,
//         'user': req.userId,
//         'signature': '',
//         'date': 0,
//         'createdAt': 0
//     };
//     const newDog = await Saque.create(obj);
//     return res.send({ msg: 'OK' });
// });

module.exports = app => app.use('/payment', router);