const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cronSchema = new Schema({
    name: String,
    jobId: String,
    lastStarted: Date,
    lastEnded: Date,
    nextScheduled: Date,
    cronExpression: String,
    createdAdminId: String,
    filter: Object,
    updateVal: Object,
    isActive: Boolean,
}, { timestamps: true }
);

const Task = mongoose.model('Cron', cronSchema);

module.exports = Task;
