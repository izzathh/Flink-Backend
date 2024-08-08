const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    areaName: String,
    createdAdminId: String,
    geometry: {
        type: {
            type: String,
            enum: ['Polygon'],
            default: 'Feature'
        },
        coordinates: {
            type: [[[Number]]],
            required: true
        }
    },
    hasGroup: Boolean
}, { timestamps: true }
);

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
