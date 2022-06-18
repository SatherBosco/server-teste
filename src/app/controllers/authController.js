require("dotenv").config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authConfig = require('../../config/auth.json');

const User = require('../models/User');

const router = express.Router();

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
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

module.exports = app => app.use('/auth', router);