const mongoose = require('../../database');

const SaqueSchema = new mongoose.Schema({
    saqueid: {
        type: Number,
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

const Saque = mongoose.model('Saque', SaqueSchema);

module.exports = Saque;