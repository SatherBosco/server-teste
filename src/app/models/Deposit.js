const mongoose = require('../../database');

const DepositSchema = new mongoose.Schema({
    transactionId: {
        type: Number,
        unique: true,
    },
    paid: {
        type: Boolean,
        default: false,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Deposit = mongoose.model('Deposit', DepositSchema);

module.exports = Deposit;