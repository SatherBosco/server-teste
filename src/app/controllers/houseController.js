require("dotenv").config();
const express = require('express');
const authMiddleware = require('../middlewares/auth');

const House = require('../models/House');
const Bed = require('../models/Bed');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        var house = await House.findOne({ user: req.userId });

        if (!house) {
            var obj = {
                'user': req.userId,
                'bone': 0,
                'comida': 0,
                'vacina': 0
            };
            house = await House.create(obj);
        }

        return res.send({ msg: 'OK', house });
    } catch (err) {
        return res.status(400).send({ msg: 'Error house create' });
    }
});

router.put('/comida', async(req, res) => {
    const { bone } = await House.findOne({ user: req.userId });

    const comidaPrice = 100;
    if (bone < comidaPrice) {
        return res.send({ msg: 'Sem Bone para comida' });
    }

    const house = await House.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': -comidaPrice, 'comida': 100 } }, { new: true });
    await house.save();

    return res.send({ msg: 'OK', house });
});

router.put('/vacina', async(req, res) => {
    const { bone } = await House.findOne({ user: req.userId });

    const vacinaPrice = 100;
    if (bone < vacinaPrice) {
        return res.send({ msg: 'Sem Bone para vacina' });
    }

    const house = await House.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': -vacinaPrice, 'vacina': 100 } }, { new: true });
    await house.save();

    return res.send({ msg: 'OK', house });
});

router.post('/bed/:bedType', async(req, res) => {
    try {
        const bedsTypes = ['simples', 'normal', 'luxo'];
        const bedsTimes = [72, 156, 336];
        const bedsPrice = [60, 120, 240];

        const bedTypeString = bedsTypes[req.params.bedType];
        const expirationTime = bedsTimes[req.params.bedType];
        const bedPrice = bedsPrice[req.params.bedType];

        const { bone } = await House.findOne({ user: req.userId });

        if (bone < bedPrice) {
            return res.send({ msg: 'Sem Bone para bed' });
        }

        var obj = {
            'bedtype': bedTypeString,
            'user': req.userId,
            'expirationbedtime': expirationTime
        };

        const bed = await Bed.create(obj);

        const house = await House.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': -bedPrice } }, { new: true });
        await house.save();

        return res.send({ msg: 'OK', bed, house });
    } catch (err) {
        return res.status(400).send({ msg: 'Error house create' });
    }
});

module.exports = app => app.use('/house', router);