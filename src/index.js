require("dotenv").config();

const express = require('express');
const cors = require('cors');

const SmartContractDeposit = require('./app/contracts/DDCDeposit.json');
const SmartContractWithdraw = require('./app/contracts/DDCWithdraw.json');
const SmartContractBuyDog = require('./app/contracts/BuyDog.json');
const SmartContractBuyHouse = require('./app/contracts/BuyHouse.json');
const ethers = require('ethers');

const gameSettings = require('./config/gameSettings.json');

const app = express();

const Deposit = require('./app/models/Deposit');
const Withdraw = require('./app/models/Withdraw');
const Account = require('./app/models/Account');
const User = require('./app/models/User');
const BuyDog = require('./app/models/BuyDog');
const BuyHouse = require('./app/models/BuyHouse');

// Add Access Control Allow Origin headers
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    return res.send({ msg: 'OK' });
});

require('./app/controllers/index')(app);

app.listen(3000);

const listenToEvents = () => {
    const NODE_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
    const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

    const SmartContractDepositObj = new ethers.Contract(
        '0xA7Fc1Ab056e1c564B3c57d294fc87a59f740208F',
        SmartContractDeposit,
        provider
    );

    const SmartContractWithdrawObj = new ethers.Contract(
        '0x0A2283BDfB444e2fd0036347765Ea90ec006bB3d',
        SmartContractWithdraw,
        provider
    );

    const SmartContractBuyDogObj = new ethers.Contract(
        '0x4936669c3b456d557a5A7140f04dA27C76bEee51',
        SmartContractBuyDog,
        provider
    );

    const SmartContractBuyHouseObj = new ethers.Contract(
        '0x214220b8a97DE7ce05e3e3BFfeDcF56CE18BE797',
        SmartContractBuyHouse,
        provider
    );

    SmartContractDepositObj.on('DepositDone', async(payer, amount, transactionId, date) => {
        console.log(`
        From ${payer}
        Amount ${amount}
        Id ${transactionId}
        Date ${date}
        `);
        const deposit = await Deposit.findOne({ transactionId: transactionId });
        if (deposit) {
            if (!deposit.paid) {
                deposit.paid = true;
                await deposit.save();

                const address = payer.toLowerCase();
                const user = await User.findOne({ wallet: address });
                const account = await Account.findOne({ user: user._id });
                if (account) {
                    account.bone = account.bone + (parseInt(ethers.utils.formatEther(amount)));
                    await account.save();
                }
            }
        }
    });

    SmartContractWithdrawObj.on('WithdrawDone', async(payer, amount, transactionId, date) => {
        console.log(`
        From ${payer}
        Amount ${amount}
        Id ${transactionId}
        Date ${date}
        `);
        const withdraw = await Withdraw.findOne({ transactionId: transactionId });
        if (withdraw) {
            if (!withdraw.paid) {
                withdraw.paid = true;
                await withdraw.save();

                const address = payer.toLowerCase();
                const user = await User.findOne({ wallet: address });
                const account = await Account.findOne({ user: user._id });
                if (account) {
                    account.bone = account.bone - (parseInt(ethers.utils.formatEther(amount)));
                    await account.save();
                }
            }
        }
    });

    SmartContractBuyDogObj.on('BuyDogDone', async(payer, amount, transactionId, date) => {
        console.log(`
        From ${payer}
        Amount ${amount}
        Id ${transactionId}
        Date ${date}
        `);
        const buyDog = await BuyDog.findOne({ transactionId: transactionId });
        if (buyDog) {
            if (!buyDog.paid) {
                buyDog.paid = true;
                await buyDog.save();

                const address = payer.toLowerCase();
                const user = await User.findOne({ wallet: address });
                const account = await Account.findOne({ user: user._id });
                if (account) {
                    account.bone = account.bone - (amount * gameSettings.dogPrice);
                    await account.save();
                }
            }
        }
    });

    SmartContractBuyHouseObj.on('BuyHouseDone', async(payer, amount, transactionId, date) => {
        console.log(`
        From ${payer}
        Amount ${amount}
        Id ${transactionId}
        Date ${date}
        `);
        const buyHouse = await BuyHouse.findOne({ transactionId: transactionId });
        if (buyHouse) {
            if (!buyHouse.paid) {
                buyHouse.paid = true;
                await buyHouse.save();

                const address = payer.toLowerCase();
                const user = await User.findOne({ wallet: address });
                const account = await Account.findOne({ user: user._id });
                if (account) {
                    account.bone = account.bone - (amount * gameSettings.housePrice);
                    await account.save();
                }
            }
        }
    });
};

listenToEvents();