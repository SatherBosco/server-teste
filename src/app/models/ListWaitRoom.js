const mongoose = require('../../database');

const ListWaitRoomSchema = new mongoose.Schema({
    roomavaliabletime: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ListWaitRoom = mongoose.model('ListWaitRoom', ListWaitRoomSchema);

module.exports = ListWaitRoom;