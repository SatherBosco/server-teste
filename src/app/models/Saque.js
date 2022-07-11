const mongoose = require('../../database');

const SaqueSchema = new mongoose.Schema({
    saqueid: {
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
    signature: {
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

const Saque = mongoose.model('Saque', SaqueSchema);

module.exports = Saque;