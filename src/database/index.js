const mongoose = require('mongoose');

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.qe8kt.mongodb.net/ddcDatabase?retryWrites=true&w=majority`)
    .then(() => {
        console.log('Conectou ao banco de dados!')
    }).catch((err) => console.log(err))

mongoose.Promise = global.Promise;

module.exports = mongoose;