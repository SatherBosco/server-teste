require("dotenv").config();

const Web3 = require('web3');
const SmartContractNFT = require('../contracts/DDCDOG.json');

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const gameSettings = require('../../config/gameSettings.json');

const User = require('../models/User');
const Account = require('../models/Account');
const Dog = require('../models/Dog');
const House = require('../models/House');
const Room = require('../models/Room')
const Bed = require('../models/Bed');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        const NODE_URL = 'https://speedy-nodes-nyc.moralis.io/b22571774cee89066f4cf22d/bsc/mainnet';
        const provider = new Web3.providers.HttpProvider(NODE_URL);
        const web3 = new Web3(provider);

        const SmartContractNFTObj = new web3.eth.Contract(
            SmartContractNFT,
            '0x90487b4Be33FaF888f4D9145172c11B70B5fF821'
        );

        const { wallet } = await User.findOne({ _id: req.userId });

        var dogsFromBSC;
        await SmartContractNFTObj.methods.getOwnerDogsId(wallet).call(function(error, result) {
            dogsFromBSC = result;
        });

        var dogsFromDB = [];

        if (dogsFromBSC.length !== 0) {
            for (let dog of dogsFromBSC) {
                const dogInDB = await Dog.findOne({ dogid: dog });

                if (dogInDB) {
                    if (dogInDB.user != req.userId) {
                        const fomeSede = new Date(new Date().getTime() + 5 * 5 * gameSettings.timeMult);
                        const changeDog = await Dog.findOneAndUpdate({ dogid: dog }, {
                            '$set': { 'user': req.userId, 'status': 'trocou', 'fome': fomeSede, 'sede': fomeSede, 'statustime': new Date() }
                        }, { new: true });
                        await changeDog.save();

                        dogsFromDB.push(changeDog);
                    } else {
                        dogsFromDB.push(dogInDB);
                    }
                } else {
                    var dogCode;
                    await SmartContractNFTObj.methods.dogs(dog).call(function(error, result) {
                        dogCode = result.dogCode;
                    });
                    const fomeSede = new Date(new Date().getTime() + 5 * 5 * gameSettings.timeMult);

                    let afinidade = (dogCode % 25) % 5;
                    afinidade = afinidade == 0 ? 4 : afinidade - 1;

                    let cla = (dogCode % 25) - 1;
                    cla = cla == -1 ? 4 : Math.trunc(cla / 5);

                    const raridade = Math.trunc((dogCode - 1) / 25);

                    var obj = {
                        'dogid': dog,
                        'dogcode': dogCode,
                        'raridade': raridade,
                        'afinidade': afinidade,
                        'cla': cla,
                        'user': req.userId,
                        'fome': fomeSede,
                        'sede': fomeSede,
                        'status': 'disponivel',
                        'statustime': new Date()
                    };
                    const newDog = await Dog.create(obj);

                    dogsFromDB.push(newDog);
                }
            }
        }

        return res.send({ msg: 'OK', dogsFromDB });
    } catch (err) {
        return res.status(400).send({ msg: 'Error loading dogs' });
    }
});

router.put('/fome/:dogId', async(req, res) => {
    try {
        const { fome } = await Dog.findOne({ user: req.userId, dogid: req.params.dogId });
        const nowDate = new Date();

        if (fome < nowDate)
            return res.send({ msg: 'O dog morreu de fome.' });

        const fomeAtual = Math.floor(Math.abs(fome.getTime() - nowDate.getTime()) / gameSettings.timeMult);

        if (fomeAtual >= 20)
            return res.send({ msg: 'Dog sem fome.' });

        const { comida } = await Account.findOne({ user: req.userId });

        const alimentarEm = 4 - Math.floor(fomeAtual / 5);

        if (comida < alimentarEm)
            return res.status(400).send({ msg: 'Sem comida.' });

        const newFome = new Date(fome.getTime() + alimentarEm * 5 * gameSettings.timeMult);

        const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'comida': -alimentarEm } }, { new: true });
        await account.save();

        const dog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'fome': newFome } }, { new: true });
        await dog.save();

        return res.send({ msg: 'OK', account, dog });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro no servidor ao alimentar o dog.' });
    }
});

router.put('/sede/:dogId', async(req, res) => {
    try {
        const { sede } = await Dog.findOne({ user: req.userId, dogid: req.params.dogId });
        const nowDate = new Date();

        if (sede < nowDate)
            return res.send({ msg: 'O dog morreu de sede.' });

        const sedeAtual = Math.floor(Math.abs(sede.getTime() - nowDate.getTime()) / gameSettings.timeMult);

        if (sedeAtual >= 20)
            return res.send({ msg: 'Dog sem sede.' });

        const hidratarEm = 4 - Math.floor(sedeAtual / 5);

        const newSede = new Date(sede.getTime() + hidratarEm * 5 * gameSettings.timeMult);

        const dog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'sede': newSede } }, { new: true });
        await dog.save();

        return res.send({ msg: 'OK', dog });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro no servidor ao hidratar o dog.' });
    }
});

router.post('/action/:dogId', async(req, res) => {
    try {
        const nowDate = new Date();
        const { status, statustime, raridade, cla, fome, sede } = await Dog.findOne({ user: req.userId, dogid: req.params.dogId });

        if (statustime > nowDate)
            return res.send({ msg: 'Dog ocupado.' });

        if (fome < nowDate)
            return res.send({ msg: 'Dog com fome.' });

        if (sede < nowDate)
            return res.send({ msg: 'Dog com sede.' });

        const recompensa = [100, 130, 160, 200, 300, 500];

        const boneIncr = status == 'trocou' ? 0 : Math.ceil(recompensa[raridade] / (gameSettings.dogBoneIncrPow[cla]));

        const dogTypeTime = new Date(nowDate.getTime() + (gameSettings.dogActionTime[cla] * gameSettings.timeMult));

        switch (status) {
            case 'disponivel':
            case 'dormindo':
                const { bone } = await Account.findOne({ user: req.userId });

                const transporteTaxa = Math.ceil(recompensa[raridade] / (gameSettings.dogBoneIncrPow[cla] * 0.05));
                if (bone < transporteTaxa)
                    return res.send({ msg: 'Sem Bone para taxa de transporte.' });

                const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': -transporteTaxa } }, { new: true });
                await account.save();

                const dog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'status': 'cavando', 'statustime': dogTypeTime } }, { new: true });
                await dog.save();

                return res.send({ msg: 'OK', account, dog });
            case 'cavando':
            case 'retornou':
            case 'trocou':
                const { bedId, casaType, roomId, houseId } = req.body;

                const bed = await Bed.findOne({ _id: bedId, user: req.userId });

                if (bed == null)
                    return res.send({ msg: 'Cama inválida.' });

                if (bed.usobedtime > nowDate)
                    return res.send({ msg: 'Cama já em uso.' });

                if (bed.expirationbedtime < dogTypeTime)
                    return res.send({ msg: 'Cama com tempo disponível menor do que o necessário.' });

                if (casaType == "room") {
                    if (roomId == "")
                        return res.send({ msg: 'Quarto inválida.' });

                    const usedRoom = await Room.findOne({ user: req.userId, _id: roomId });

                    if (usedRoom == null)
                        return res.send({ msg: 'Quarto inválida.' });

                    if (usedRoom.usoroomtime > nowDate)
                        return res.send({ msg: 'Quarto já em uso.' });

                    if (new Date(usedRoom.roomstarttime.getTime() + (usedRoom.timemult * 24 * gameSettings.timeMult)) < dogTypeTime)
                        return res.send({ msg: 'Quarto com tempo disponível menor do que o necessário.' });
                } else {
                    if (houseId == "")
                        return res.send({ msg: 'Casa inválida.' });

                    const usedHouse = await House.findOne({ user: req.userId, _id: houseId });

                    if (usedHouse == null)
                        return res.send({ msg: 'Casa inválida.' });

                    if (usedHouse.usohousetime > nowDate)
                        return res.send({ msg: 'Casa já em uso.' });
                }

                const usedBed = await Bed.findOneAndUpdate({ user: req.userId, _id: bedId }, { '$set': { 'usobedtime': dogTypeTime } }, { new: true });
                await usedBed.save();

                const usedDog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'status': 'dormindo', 'statustime': dogTypeTime } }, { new: true });
                await usedDog.save();

                var usedHouse;
                var usedRoom;

                if (casaType == "room") {
                    usedRoom = await Room.findOneAndUpdate({ user: req.userId, _id: roomId }, { '$set': { 'usoroomtime': dogTypeTime } }, { new: true });
                    await usedRoom.save();
                } else {
                    usedHouse = await House.findOneAndUpdate({ user: req.userId, _id: houseId }, { '$set': { 'usohousetime': dogTypeTime } }, { new: true });
                    await usedHouse.save();
                }

                const usedAccount = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': boneIncr } }, { new: true });
                await usedAccount.save();

                return res.send({ msg: 'OK', usedAccount, usedDog, usedBed, usedHouse, usedRoom });
            default:
                return res.send({ msg: 'Status não identificado' });
        }
    } catch (err) {
        return res.status(400).send({ msg: 'Erro no servidor ao gerenciar o pet.' });
    }
});

module.exports = app => app.use('/dogs', router);