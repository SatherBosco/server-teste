const mongoose = require('../../database');

const HouseSchema = new mongoose.Schema({
    houseid: {
        type: Number,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    usohousetime: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const House = mongoose.model('House', HouseSchema);

module.exports = House;