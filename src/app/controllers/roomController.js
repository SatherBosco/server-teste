require("dotenv").config();

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const gameSettings = require('../../config/gameSettings.json');

const User = require('../models/User');
const Account = require('../models/Account');
const Room = require('../models/Room');
const ListWaitRoom = require('../models/ListWaitRoom');
const Dog = require('../models/Dog');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        const rooms = await Room.find({ user: req.userId });
        var roomAvaliable;

        if (rooms.length != 0) {
            for (let room of rooms) {
                const nowDate = new Date();
                const expirationTime = room.roomstarttime.getTime() + (24 * gameSettings.timeMult);
                if (expirationTime < nowDate) {
                    await Room.findByIdAndRemove({ _id: room._id });
                } else {
                    roomAvaliable = room;
                }
            }
        }

        return res.send({ msg: 'OK', roomAvaliable });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro ao verificar seus registros no resort.' });
    }
});

router.post('/', async(req, res) => {
    const { _id, roomavaliabletime } = req.body;

    try {
        const rooms = await Room.find({ user: req.userId });
        if (rooms.length != 0) {
            for (let room of rooms) {
                const nowDate = new Date();
                const expirationTime = room.roomstarttime.getTime() + (24 * gameSettings.timeMult);
                if (expirationTime < nowDate) {
                    await Room.findByIdAndRemove({ _id: room._id });
                } else {
                    return res.status(400).send({ msg: 'Erro: Já existe um quarto alugado nessa conta.' });
                }
            }
        }

        const roomForWaitList = await ListWaitRoom.findOne({ _id });

        if (roomForWaitList.roomavaliabletime.getTime() != new Date(roomavaliabletime).getTime()) {
            return res.status(400).send({ msg: 'Erro: Horário do quarto desejado já foi reivindicado.' });
        }

        var startTimeRight = new Date();
        if (new Date(roomavaliabletime) > startTimeRight)
            startTimeRight = new Date(roomavaliabletime);

        var obj = {
            'user': req.userId,
            'roomstarttime': startTimeRight
        };

        const roomAvaliable = await Room.create(obj);

        const newRoomavAliableTime = new Date(startTimeRight.getTime() + (24 * gameSettings.timeMult));
        const changeListWaitRoom = await ListWaitRoom.findOneAndUpdate({ _id }, { '$set': { 'roomavaliabletime': newRoomavAliableTime } }, { new: true });
        await changeListWaitRoom.save();
        return res.send({ msg: 'OK', roomAvaliable });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor ao alugar um quarto.' });
    }
});

router.get('/waitlist', async(req, res) => {
    try {
        const nextroom = await ListWaitRoom.findOne({}).sort({ 'roomavaliabletime': 1 }).limit(1);

        return res.send({ msg: 'OK', nextroom });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor ao localizar horários disponíveis.' });
    }
});

// router.post('/createlistroom', async(req, res) => {
//     var obj = {
//         'roomavaliabletime': new Date()
//     };
//     try {
//         for (let index = 0; index < 100; index++) {
//             await ListWaitRoom.create(obj);
//         }

//         return res.send({ msg: 'OK' });
//     } catch (err) {
//         return res.status(400).send({ msg: 'Error create room' });
//     }
// });

module.exports = app => app.use('/room', router);