require("dotenv").config();

const Web3 = require('web3');
const SmartContractNFT = require('../contracts/DDCHouse.json');

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const House = require('../models/House');
const User = require('../models/User');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        const NODE_URL = 'https://speedy-nodes-nyc.moralis.io/b22571774cee89066f4cf22d/bsc/mainnet';
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

module.exports = app => app.use('/house', router);