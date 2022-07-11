const mongoose = require('../../database');

const PaymentSchema = new mongoose.Schema({
    paymentid: {
        type: Number,
        unique: true,
    },
    itemid: {
        type: String,
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

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;