require("dotenv").config();
const express = require('express');
const authMiddleware = require('../middlewares/auth');

const gameSettings = require('../../config/gameSettings.json');

const Account = require('../models/Account');
const Bed = require('../models/Bed');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        var account = await Account.findOne({ user: req.userId });

        if (!account) {
            var obj = {
                'user': req.userId,
                'bone': 10000,
                'comida': 0,
                'vacina': 0
            };
            account = await Account.create(obj);
        }

        return res.send({ msg: 'OK', account });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor ao criar a conta.' });
    }
});

router.put('/comida', async(req, res) => {
    try {
        const { bone } = await Account.findOne({ user: req.userId });

        const comidaPrice = 100;
        if (bone < comidaPrice) {
            return res.send({ msg: 'Sem Bone para comprar comida.' });
        }

        const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': -comidaPrice, 'comida': 100 } }, { new: true });
        await account.save();

        return res.send({ msg: 'OK', account });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor ao comprar comida.' });
    }
});

router.put('/vacina', async(req, res) => {
    try {
        const { bone } = await Account.findOne({ user: req.userId });

        const vacinaPrice = 100;
        if (bone < vacinaPrice) {
            return res.send({ msg: 'Sem Bone para comprar vacina.' });
        }

        const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': -vacinaPrice, 'vacina': 100 } }, { new: true });
        await account.save();

        return res.send({ msg: 'OK', account });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor ao comprar vacina.' });
    }
});

router.put('/bed/:bedType', async(req, res) => {
    try {
        const bedsTypes = ['simples', 'normal', 'luxo'];
        const bedsTimes = [72, 156, 336];
        const bedsPrice = [60, 120, 240];

        const dateNow = new Date();

        const bedTypeString = bedsTypes[req.params.bedType];
        const expirationTime = new Date(dateNow.getTime() + bedsTimes[req.params.bedType] * gameSettings.timeMult);
        const bedPrice = bedsPrice[req.params.bedType];

        const { bone } = await Account.findOne({ user: req.userId });

        if (bone < bedPrice) {
            return res.send({ msg: 'Sem Bone para comprar cama.' });
        }

        var obj = {
            'bedtype': bedTypeString,
            'user': req.userId,
            'expirationbedtime': expirationTime
        };

        const bed = await Bed.create(obj);

        const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': -bedPrice } }, { new: true });
        await account.save();

        return res.send({ msg: 'OK', bed, account });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor ao comprar cama.' });
    }
});

module.exports = app => app.use('/account', router);