require("dotenv").config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Web3 = require('web3');

const authConfig = require('../../config/auth.json');

const User = require('../models/User');

const router = express.Router();

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
}

function generateRecoverToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 450,
    });
}

router.post('/register', async(req, res) => {
    const { username, email, wallet } = req.body;

    try {
        if (await User.findOne({ username }))
            return res.status(400).send({ msg: 'Username indisponível.' });

        if (await User.findOne({ email }))
            return res.status(400).send({ msg: 'Email já em uso.' });

        if (await User.findOne({ wallet }))
            return res.status(400).send({ msg: 'Carteira já registrada.' });

        return res.send({
            msg: 'OK',
            token: generateRecoverToken({ wallet: wallet }),
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na criação da conta.' });
    }
});

router.post('/registercontinuation', async(req, res) => {
    const { username, email, wallet, message, signature } = req.body;

    try {
        const web3 = new Web3();
        const address = web3.eth.accounts.recover(message, signature);

        const messageArray = message.split(" ");
        const token = messageArray[24];

        if (!token)
            return res.status(401).send({ msg: 'Erro: Sem token.' });

        var decodedWallet;
        var erro = false;
        jwt.verify(token, authConfig.secret, (err, decoded) => {
            if (err)
                erro = true;

            if (!err)
                decodedWallet = decoded.wallet;
        });

        if (erro)
            return res.status(401).send({ msg: 'O token expirou.' });

        if (address.toLowerCase() !== wallet.toLowerCase() || wallet.toLowerCase() !== decodedWallet.toLowerCase())
            return res.status(400).send({ msg: 'Identidade não confirmada.' });

        if (await User.findOne({ username }))
            return res.status(400).send({ msg: 'Username indisponível.' });

        if (await User.findOne({ email }))
            return res.status(400).send({ msg: 'Email já em uso.' });

        if (await User.findOne({ wallet }))
            return res.status(400).send({ msg: 'Carteira já registrada.' });

        const user = await User.create(req.body);

        user.password = undefined;

        return res.send({
            msg: 'OK',
            user,
            token: generateToken({ id: user.id }),
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na criação da conta.' });
    }
});

router.post('/authenticate', async(req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select('+password');

    if (!user)
        return res.status(400).send({ msg: 'Username e/ou senha inválido.' });

    if (!await bcrypt.compare(password, user.password))
        return res.status(400).send({ msg: 'Username e/ou senha inválido.' });

    user.password = undefined;

    res.send({
        msg: 'OK',
        user,
        token: generateToken({ id: user.id }),
    });
});

router.post('/recoverpassword', async(req, res) => {
    const { wallet } = req.body;

    try {
        const user = await User.findOne({ wallet });

        if (!user)
            return res.status(400).send({ msg: 'Solicitação inválida.' });

        return res.send({
            msg: 'OK',
            token: generateRecoverToken({ wallet: wallet, date: new Date() }),
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na troca da senha.' });
    }
});

router.post('/recovercontinuation', async(req, res) => {
    const { wallet, message, signature, username, newpassword } = req.body;

    try {
        const web3 = new Web3();
        const address = web3.eth.accounts.recover(message, signature);

        const messageArray = message.split(" ");
        const token = messageArray[10];

        if (!token)
            return res.status(401).send({ msg: 'Erro: Sem token.' });

        var decodedWallet;
        var decodedDate;
        var erro = false;
        jwt.verify(token, authConfig.secret, (err, decoded) => {
            if (err)
                erro = true;

            if (!err) {
                decodedWallet = decoded.wallet;
                decodedDate = decoded.date
            }
        });

        if (erro)
            return res.status(401).send({ msg: 'O token expirou.' });

        if (address.toLowerCase() !== wallet.toLowerCase() || wallet.toLowerCase() !== decodedWallet.toLowerCase())
            return res.status(400).send({ msg: 'Identidade não confirmada.' });

        const user = await User.findOne({ wallet: wallet }).select('+password +passwordchange');

        if (user.username !== username)
            return res.status(400).send({ msg: 'O username informado não corresponde a essa conta.' });

        // if (new Date(decodedDate) < user.passwordchange)
        //     return res.status(400).send({ msg: 'Token inválido.' });

        user.password = newpassword;
        user.passwordchange = new Date();
        await user.save();

        user.password = undefined;
        user.passwordchange = undefined;

        return res.send({
            msg: 'OK'
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na troca da senha.' });
    }
});

router.post('/recoverusername', async(req, res) => {
    const { wallet, message, signature } = req.body;

    try {
        const web3 = new Web3();
        const address = web3.eth.accounts.recover(message, signature);

        const addressFromMessage = message.split(" ");

        if (address.toLowerCase() !== wallet.toLowerCase() || wallet.toLowerCase() !== addressFromMessage[8].toLowerCase())
            return res.status(400).send({ msg: 'Identidade não confirmada.' });

        const user = await User.findOne({ wallet });

        if (!user)
            return res.status(400).send({ msg: 'Solicitação inválida.' });

        return res.send({
            msg: 'OK',
            user,
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na recuperação do username.' });
    }
});

module.exports = app => app.use('/auth', router);