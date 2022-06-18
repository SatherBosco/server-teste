const mongoose = require('../../database');

const BedSchema = new mongoose.Schema({
    bedtype: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    usobedtime: {
        type: Date,
        default: Date.now,
    },
    expirationbedtime: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Bed = mongoose.model('Bed', BedSchema);

module.exports = Bed;