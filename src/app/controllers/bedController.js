require("dotenv").config();
const express = require('express');
const authMiddleware = require('../middlewares/auth');

const Bed = require('../models/Bed');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        const beds = await Bed.find({ user: req.userId });

        const dateNow = new Date();

        var bedsFromDB = [];

        for (let bed of beds) {
            if (bed.expirationbedtime <= dateNow) {
                await Bed.findByIdAndRemove(bed.bedid);
            } else {
                bedsFromDB.push(bed);
            }
        }

        return res.send({ msg: 'OK', bedsFromDB });
    } catch (err) {
        return res.status(400).send({ msg: 'Error find bed' });
    }
});

module.exports = app => app.use('/bed', router);