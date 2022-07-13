require("dotenv").config();

const Web3 = require('web3');
const SmartContractNFT = require('../contracts/DDCHouse.json');

const ethers = require('ethers');
const SmartContractBuyHouse = require('../contracts/BuyHouse.json');

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const gameSettings = require('../../config/gameSettings.json');

const House = require('../models/House');
const User = require('../models/User');
const BuyHouse = require('../models/BuyHouse');
const Account = require('../models/Account');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        const NODE_URL = 'https://bsc-dataseed.binance.org/';
        const provider = new Web3.providers.HttpProvider(NODE_URL);
        const web3 = new Web3(provider);

        const SmartContractNFTObj = new web3.eth.Contract(
            SmartContractNFT,
            '0x21A8B00b925817A6EcCf67921D6A1912AAb0539a'
        );

        const { wallet } = await User.findOne({ _id: req.userId });

        var housesFromBSC;
        await SmartContractNFTObj.methods.getOwnerHousesId(wallet).call(function(error, result) {
            housesFromBSC = result;
        });

        var housesFromDB = [];


        if (housesFromBSC.length !== 0) {
            for (let house of housesFromBSC) {
                const houseInDB = await House.findOne({ houseid: house });

                if (houseInDB) {
                    if (houseInDB.user != req.userId) {
                        const changeHouse = await House.findOneAndUpdate({ houseid: house }, { '$set': { 'user': req.userId } }, { new: true });
                        await changeHouse.save();

                        housesFromDB.push(changeHouse);
                    } else {
                        housesFromDB.push(houseInDB);
                    }
                } else {
                    var obj = {
                        'houseid': house,
                        'user': req.userId
                    };
                    const newHouse = await House.create(obj);

                    housesFromDB.push(newHouse);
                }
            }
        }

        return res.send({ msg: 'OK', housesFromDB });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor ao localizar as casas disponíveis.' });
    }
});

router.post('/buy', async(req, res) => {
    const buyHouseReq = req.body;
    try {
        let buyHouse;

        const buyHouseDate = await BuyHouse.findOne({ user: req.userId }).sort({ 'createdAt': -1 }).limit(1);

        if (buyHouseDate !== null) {
            if (!buyHouseDate.paid) {
                if ((new Date(buyHouseDate.createdAt).getTime() + 1200000) > new Date().getTime()) { // ADICIONAR VARIAVEL PARA A DATA
                    if ((new Date(buyHouseDate.createdAt).getTime() + 600000) > new Date().getTime()) { // ADICIONAR VARIAVEL PARA A DATA
                        buyHouse = buyHouseDate;
                        return res.send({ msg: 'OK', buyHouse });
                    } else {
                        return res.status(400).send({ msg: 'Caso não tenha completado a última compra espere pelo menos 20 minutos para solicitar outra.' });
                    }
                }
            }
        }

        const account = await Account.findOne({ user: req.userId });

        if (buyHouseReq.amount * gameSettings.housePrice > account.bone)
            return res.status(400).send({ msg: 'Você não possui Bone o suficiente.' });

        const { transactionId } = await BuyHouse.findOne({}).sort({ 'transactionId': -1 }).limit(1);
        const user = await User.findOne({ _id: req.userId });

        const newTransactionId = transactionId + 1;

        const NODE_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
        const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

        const _contract = '0x214220b8a97DE7ce05e3e3BFfeDcF56CE18BE797';
        const SmartContractBuyHouseObj = new ethers.Contract(
            _contract,
            SmartContractBuyHouse,
            provider
        );

        const _recipient = user.wallet.toString();
        const _amount = buyHouseReq.amount;
        const _transactionId = parseInt(newTransactionId);
        _date = parseInt(new Date().getTime() / 1000);

        let buyHouseTransaction = await SmartContractBuyHouseObj.getMessage(
            _recipient,
            _amount,
            _transactionId,
            _date,
            _contract
        );

        const PRIV_KEY = '0xd209f0a532283abb0a3b05396a38a3edf379400100b28717602950fe43a90a27';
        const signer = new ethers.Wallet(PRIV_KEY);

        sigMessage = await signer.signMessage(ethers.utils.arrayify(buyHouseTransaction));

        let buyHouseObj = {
            'transactionId': newTransactionId,
            'paid': false,
            'user': req.userId,
            'signature': sigMessage,
            'amount': _amount.toString(),
            'date': _date
        }

        buyHouse = await BuyHouse.create(buyHouseObj);

        return res.send({ msg: 'OK', buyHouse });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor.' });
    }
});

module.exports = app => app.use('/house', router);