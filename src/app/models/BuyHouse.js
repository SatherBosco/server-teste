const mongoose = require('../../database');

const BuyHouseSchema = new mongoose.Schema({
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
    signature: {
        type: String,
    },
    amount: {
        type: String,
    },
    date: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const BuyHouse = mongoose.model('BuyHouse', BuyHouseSchema);

module.exports = BuyHouse;