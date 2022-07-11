const mongoose = require('../../database');

const DogSchema = new mongoose.Schema({
    dogid: {
        type: Number,
        required: true,
        unique: true,
    },
    dogcode: {
        type: Number,
        required: true,
    },
    raridade: {
        type: Number,
        required: true,
    },
    afinidade: {
        type: Number,
        required: true,
    },
    cla: {
        type: Number,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fome: {
        type: Date,
        required: true,
    },
    sede: {
        type: Date,
        required: true,
    },
    penalidade: {
        type: Number,
        default: 0,
    },
    penalidadedate: {
        type: Date,
        default: 0,
    },
    status: {
        type: String,
        required: true,
    },
    statustime: {
        type: Date,
        required: true,
    },
    house: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'House',
    },
    bed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bed',
    },
    idade: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Dog = mongoose.model('Dog', DogSchema);

module.exports = Dog;