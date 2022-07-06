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

function generateAuthToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 3600,
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
            token: generateAuthToken({ wallet: wallet }),
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na criação da conta.' });
    }
});

router.post('/registercontinuation', async(req, res) => {
    const { dataSigned, hash } = req.body;
    const { username, email, wallet } = req.body;

    try {
        const web3 = new Web3();
        const address = web3.eth.accounts.recover(dataSigned, hash);

        if (!dataSigned)
            return res.status(401).send({ error: 'Erro: Sem token.' });

        const parts = dataSigned.split(' ');

        if (!parts.length === 2)
            return res.status(401).send({ error: 'Erro no Token.' });

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme))
            return res.status(401).send({ error: 'Token malformado.' });

        var decodedwallet;
        jwt.verify(token, authConfig.secret, (err, decoded) => {
            if (err)
                return res.status(401).send({ error: 'Token inválido.' });

            decodedwallet = decoded.wallet;
        });

        if (wallet !== address || decodedwallet !== wallet)
            return res.status(400).send({ msg: 'Falha na assinatura.' });

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
        return res.status(400).send({ msg: 'Credenciais inválidas.' });

    if (!await bcrypt.compare(password, user.password))
        return res.status(400).send({ msg: 'Credenciais inválidas.' });

    user.password = undefined;

    res.send({
        msg: 'OK',
        user,
        token: generateToken({ id: user.id }),
    });
});

router.post('/recover', async(req, res) => {
    const { wallet } = req.body;

    try {
        const user = await User.findOne({ wallet });

        if (!user)
            return res.status(400).send({ msg: 'Solicitação inválida.' });

        return res.send({
            msg: 'OK',
            token: generateAuthToken({ wallet: wallet }),
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na recuperação da conta.' });
    }
});

router.post('/recovercontinuation', async(req, res) => {
    const { dataSigned, hash, wallet, newpassword } = req.body;

    try {
        const web3 = new Web3();
        const address = web3.eth.accounts.recover(dataSigned, hash);
        console.log(address);

        if (!dataSigned)
            return res.status(401).send({ error: 'Erro: Sem token.' });

        const parts = dataSigned.split(' ');

        if (!parts.length === 2)
            return res.status(401).send({ error: 'Erro no Token.' });

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme))
            return res.status(401).send({ error: 'Token malformado.' });

        var decodedwallet;
        jwt.verify(token, authConfig.secret, (err, decoded) => {
            if (err)
                return res.status(401).send({ error: 'Token inválido.' });

            decodedwallet = decoded.wallet;
        });

        if (wallet !== address || decodedwallet !== wallet)
            return res.status(400).send({ msg: 'Falha na assinatura.' });

        const user = await User.findOne({ wallet: wallet }).select('+password');
        user.password = newpassword;
        await user.save();

        user.password = undefined;

        return res.send({
            msg: 'OK',
            user,
            token: generateToken({ id: user.id }),
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na recuperação da conta.' });
    }
});

router.post('/recoverusername', async(req, res) => {
    const { wallet } = req.body;

    try {
        const user = await User.findOne({ wallet });

        if (!user)
            return res.status(400).send({ msg: 'Solicitação inválida.' });

        return res.send({
            msg: 'OK',
            token: generateAuthToken({ wallet: wallet }),
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na recuperação da conta.' });
    }
});

router.post('/recoverusernamecontinuation', async(req, res) => {
    const { dataSigned, hash, wallet } = req.body;

    try {
        const web3 = new Web3();
        const address = web3.eth.accounts.recover(dataSigned, hash);
        console.log(address);

        if (!dataSigned)
            return res.status(401).send({ error: 'Erro: Sem token.' });

        const parts = dataSigned.split(' ');

        if (!parts.length === 2)
            return res.status(401).send({ error: 'Erro no Token.' });

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme))
            return res.status(401).send({ error: 'Token malformado.' });

        var decodedwallet;
        jwt.verify(token, authConfig.secret, (err, decoded) => {
            if (err)
                return res.status(401).send({ error: 'Token inválido.' });

            decodedwallet = decoded.wallet;
        });

        if (wallet !== address || decodedwallet !== wallet)
            return res.status(400).send({ msg: 'Falha na assinatura.' });

        const user = await User.findOne({ wallet: wallet });
        user.password = undefined;

        return res.send({
            msg: 'OK',
            user
        });
    } catch (err) {
        return res.status(400).send({ msg: 'Falha na recuperação da conta.' });
    }
});

module.exports = app => app.use('/auth', router);