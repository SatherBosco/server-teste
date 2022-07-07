require("dotenv").config();

const express = require('express');
const cors = require('cors');

const SmartContractNFT = require('./app/contracts/Payment.json');
const ethers = require('ethers');

const app = express();

const Payment = require('./app/models/Payment');
const Account = require('./app/models/Account');

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

    const SmartContractNFTObj = new ethers.Contract(
        '0x5Cda6a4E61A4b97A16E5B7FE3D6b20de8930729a',
        SmartContractNFT,
        provider
    );

    SmartContractNFTObj.on('PaymentDone', async(payer, amount, paymentId, date) => {
        console.log(`
        from ${payer}
        amount ${amount}
        id ${paymentId}
        date ${date}
        `);
        const payment = await Payment.findOne({ paymentid: paymentId });
        if (payment) {
            payment.paid = true;
            await payment.save();
        }
        const address = payer.toLowerCase();
        const account = await Account.findOne({ wallet: address });
        if (account) {
            account.bone = account.bone + (amount / Math.pow(10, 18));
            await account.save();
        }
    });
};

listenToEvents();