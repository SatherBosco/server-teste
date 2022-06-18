require("dotenv").config();

const Web3 = require('web3');
const SmartContractNFT = require('../contracts/DDCDOG.json');

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const User = require('../models/User');
const Account = require('../models/Account');
const Dog = require('../models/Dog');
const House = require('../models/House');
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
                        const fomeSede = new Date(new Date().getTime() + 5 * 5 * 3600000);
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
                    const fomeSede = new Date(new Date().getTime() + 5 * 5 * 3600000);

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

        for (let dog in dogsFromDB) {

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
            return res.send({ msg: 'O dog morreu de fome' });

        const fomeAtual = Math.floor(Math.abs(fome.getTime() - nowDate.getTime()) / 3600000);

        if (fomeAtual >= 20)
            return res.send({ msg: 'Dog sem fome' });

        const { comida } = await Account.findOne({ user: req.userId });

        const alimentarEm = 4 - Math.floor(fomeAtual / 5);

        if (comida < alimentarEm)
            return res.status(400).send({ msg: 'Without food' });

        const newFome = new Date(fome.getTime() + alimentarEm * 5 * 3600000);

        const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'comida': -alimentarEm } }, { new: true });
        await account.save();

        const dog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'fome': newFome } }, { new: true });
        await dog.save();

        return res.send({ msg: 'OK', account, dog });
    } catch (err) {
        return res.status(400).send({ msg: 'Error food' });
    }
});

router.put('/sede/:dogId', async(req, res) => {
    try {
        const { sede } = await Dog.findOne({ user: req.userId, dogid: req.params.dogId });
        const nowDate = new Date();

        if (sede < nowDate)
            return res.send({ msg: 'O dog morreu de sede' });

        const sedeAtual = Math.floor(Math.abs(sede.getTime() - nowDate.getTime()) / 3600000);

        if (sedeAtual >= 20)
            return res.send({ msg: 'Dog sem sede' });

        const hidratarEm = 4 - Math.floor(sedeAtual / 5);

        const newSede = new Date(sede.getTime() + hidratarEm * 5 * 3600000);

        const dog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'sede': newSede } }, { new: true });
        await dog.save();

        return res.send({ msg: 'OK', dog });
    } catch (err) {
        return res.status(400).send({ msg: 'Error water' });
    }
});

router.put('/vacina/:dogId', async(req, res) => {
    try {
        const { doente } = await Dog.findOne({ user: req.userId, dogid: req.params.dogId });

        if (!doente)
            return res.send({ msg: 'O dog nao esta doente' });

        const { vacina } = await Account.findOne({ user: req.userId });

        if (vacina <= 0)
            return res.status(400).send({ msg: 'Without vacina' });

        const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'vacina': -1 } }, { new: true });
        await account.save();

        const dog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'doente': false } }, { new: true });
        await dog.save();

        return res.send({ msg: 'OK', account, dog });
    } catch (err) {
        return res.status(400).send({ msg: 'Error vacina' });
    }
});

router.post('/action/:dogId', async(req, res) => {
    try {
        const { status, statustime, raridade, cla, doente, fome, sede } = await Dog.findOne({ user: req.userId, dogid: req.params.dogId });
        const { bone } = await Account.findOne({ user: req.userId });

        const nowDate = new Date();
        var newStatus = status;
        var newStatusTime = nowDate;
        const dogTypeTime = new Date(nowDate.getTime() + (1.5 * Math.pow(2, cla) * 3600000));
        var boneIncr = 0;
        var newDoente = false;
        const recompensa = [100, 130, 160, 200, 300, 500];

        if (statustime > nowDate)
            return res.send({ msg: 'Dog in action' });

        if (fome < nowDate)
            return res.send({ msg: 'Dog com fome' });

        if (sede < nowDate)
            return res.send({ msg: 'Dog com sede' });

        switch (status) {
            case 'disponivel':
                if (doente)
                    return res.send({ msg: 'Dog doente' });

                const transporteTaxa = Math.ceil(recompensa[raridade] / (Math.pow(2, (4 - cla)))) * -0.05;
                if (bone < transporteTaxa)
                    return res.send({ msg: 'Sem Bone para taxa' });

                boneIncr = transporteTaxa;

                newStatusTime = dogTypeTime;
                newStatus = 'cavando';

                console.log('chegou');
                break;
            case 'cavando':
                if ((Math.floor(Math.random() * (5 - 0) + 0)) == 0)
                    newDoente = true;

                newStatus = 'retornou';
                break;
            case 'retornou':
            case 'trocou':
                // const { usohousetime } = await House.findOne({ user: req.userId, houseid: req.houseId });
                const { usobedtime, expirationbedtime } = await Bed.findOne({ user: req.userId, _id: req.bedId });

                // if (usohousetime > nowDate)
                //     return res.send({ msg: 'Casa indisponivel' });

                if (usobedtime > nowDate)
                    return res.send({ msg: 'Cama indisponivel' });

                // const newHouseTime = dogTypeTime;
                const newBedTime = dogTypeTime;

                if (expirationbedtime < newBedTime)
                    return res.send({ msg: 'Cama indisponivel' });

                // const house = await House.findOneAndUpdate({ user: req.userId, houseid: req.houseId }, { '$inc': { 'usohousetime': newHouseTime } }, { new: true });
                // await house.save();

                const bed = await Bed.findOneAndUpdate({ user: req.userId, _id: req.bedId }, { '$inc': { 'usobedtime': newBedTime } }, { new: true });
                await bed.save();

                if (status == 'retornou')
                    boneIncr = Math.ceil(recompensa[raridade] / (Math.pow(2, (4 - cla))));

                newStatusTime = dogTypeTime;
                newStatus = 'dormindo';
                break;
            case 'dormindo':
                newStatus = 'disponivel';
                break;
            default:
                return res.send({ msg: 'Status nao identificado' });
        }

        const account = await Account.findOneAndUpdate({ user: req.userId }, { '$inc': { 'bone': boneIncr } }, { new: true });
        await account.save();

        const dog = await Dog.findOneAndUpdate({ user: req.userId, dogid: req.params.dogId }, { '$set': { 'status': newStatus, 'statustime': newStatusTime, 'doente': newDoente } }, { new: true });
        await dog.save();

        return res.send({ msg: 'OK', account, dog });
    } catch (err) {
        return res.status(400).send({ msg: 'Error action' });
    }
});

router.post('/create', async(req, res) => {
    try {
        if (await Account.findOne({ user: req.userId }))
            return res.status(400).send({ msg: 'Username already exists in account' });

        const account = await Account.create(req.body);

        return res.send({
            msg: 'OK',
            account,
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Create account failed' });
    }
});

module.exports = app => app.use('/dogs', router);