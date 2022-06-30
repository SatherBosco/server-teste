const mongoose = require('../../database');

const RoomSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    roomstarttime: {
        type: Date,
        required: true,
    },
    usoroomtime: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;