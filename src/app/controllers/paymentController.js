require("dotenv").config();

const ethers = require('ethers');
const SmartContractWithdraw = require('../contracts/DDCWithdraw.json');

const express = require('express');
const authMiddleware = require('../middlewares/auth');

const User = require('../models/User');
const Account = require('../models/Account');
const Deposit = require('../models/Deposit');
const Withdraw = require('../models/Withdraw');

const router = express.Router();

router.use(authMiddleware);

router.post('/withdraw', async(req, res) => {
    const withdrawReq = req.body;
    try {
        let withdraw;

        const withdrawDate = await Withdraw.findOne({ user: req.userId }).sort({ 'createdAt': -1 }).limit(1);

        if (withdrawDate !== null) {
            if (!withdrawDate.paid) {
                if ((new Date(withdrawDate.createdAt).getTime() + 1200000) > new Date().getTime()) { // ADICIONAR VARIAVEL PARA A DATA
                    if ((new Date(withdrawDate.createdAt).getTime() + 600000) > new Date().getTime()) { // ADICIONAR VARIAVEL PARA A DATA
                        withdraw = withdrawDate;
                        return res.send({ msg: 'OK', withdraw });
                    } else {
                        return res.status(400).send({ msg: 'Caso não tenha completado o último saque espere pelo menos 20 minutos para solicitar outro.' });
                    }
                }
            } else {
                if ((new Date(withdrawDate.createdAt).getTime() + 48 * 3600000) > new Date().getTime()) { // ADICIONAR VARIAVEL PARA A DATA
                    return res.status(400).send({ msg: 'Saque disponivel apenas 48 horas após o último.' });
                }
            }
        }

        const account = await Account.findOne({ user: req.userId });
        if (withdrawReq.bone < 400)
            return res.status(400).send({ msg: 'Saque mínimo de 400 Bone.' });
        if (account.bone - withdrawReq.bone < 100)
            return res.status(400).send({ msg: 'É necessário deixar no mínimo 100 Bone na conta.' });

        const { transactionId } = await Withdraw.findOne({}).sort({ 'transactionId': -1 }).limit(1);
        const user = await User.findOne({ _id: req.userId });

        const newTransactionId = transactionId + 1;

        const NODE_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
        const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

        const _contract = '0x0A2283BDfB444e2fd0036347765Ea90ec006bB3d';
        const SmartContractWithdrawObj = new ethers.Contract(
            _contract,
            SmartContractWithdraw,
            provider
        );

        const _recipient = user.wallet.toString();
        const _amount = ethers.utils.parseEther(withdrawReq.bone);
        const _transactionId = parseInt(newTransactionId);
        _date = parseInt(new Date().getTime() / 1000);

        let withdrawTransaction = await SmartContractWithdrawObj.getMessage(
            _recipient,
            _amount,
            _transactionId,
            _date,
            _contract
        );

        const PRIV_KEY = '0xd209f0a532283abb0a3b05396a38a3edf379400100b28717602950fe43a90a27';
        const signer = new ethers.Wallet(PRIV_KEY);

        sigMessage = await signer.signMessage(ethers.utils.arrayify(withdrawTransaction));

        let withdrawObj = {
            'transactionId': newTransactionId,
            'paid': false,
            'user': req.userId,
            'signature': sigMessage,
            'amount': _amount.toString(),
            'date': _date
        }

        withdraw = await Withdraw.create(withdrawObj);

        return res.send({ msg: 'OK', withdraw });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor.' });
    }
});

router.post('/deposit', async(req, res) => {
    try {
        const { transactionId } = await Deposit.findOne({}).sort({ 'transactionId': -1 }).limit(1);

        const newTransactionId = transactionId + 1;

        let depositObj = {
            'transactionId': newTransactionId,
            'paid': false,
            'user': req.userId,
        }

        const deposit = await Deposit.create(depositObj);

        return res.send({ msg: 'OK', deposit });
    } catch (err) {
        return res.status(400).send({ msg: 'Erro do servidor.' });
    }
});

module.exports = app => app.use('/payment', router);