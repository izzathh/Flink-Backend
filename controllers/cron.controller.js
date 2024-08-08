const moment = require('moment-timezone');
const cron = require("node-cron");
const Counter = require('../models/counter.model')
const Common = require("../models/common.model");
const Task = require('../models/cron.model');
const Order = require("../models/orders.model");
const CronJobManager = require('cron-job-manager');

const manager = new CronJobManager();

async function archiveOrders(adminId, targetTimeZone) {
    try {
        const startTime = moment.tz(targetTimeZone);

        console.log(`Running cron in ${targetTimeZone}`);
        const formattedEndTime = startTime.format('DD/MM/YYYY hh:mm A');

        const existingTask = await Task.findOne({
            name: 'autoArchiveCron',
            createdAdminId: adminId
        });

        existingTask.lastStarted = startTime
        existingTask.updateVal.archivedAt = formattedEndTime
        existingTask.save()

        const updatedDocument = await Order.updateMany(
            existingTask.filter,
            { $set: existingTask.updateVal },
            { new: true }
        );

        const findCounter = await Counter.findOne({ createdAdminId: adminId });
        findCounter.orderNumber = 0
        findCounter.save()

        if (!updatedDocument) {
            return res.status(404).json({ message: "Data not found" });
        }

        const endTime = moment.tz(targetTimeZone);
        const executionTime = endTime - startTime;
        console.log(`Cron job executed in ${executionTime} milliseconds at ${endTime}`);
        existingTask.lastEnded = endTime
        existingTask.save()
    } catch (e) {
        console.log(e);
    }
}


async function checkExistingCrons() {
    try {
        const common = await Common.find({ 'deliveryHours.autoArchiveTime.runCron': true }).select(
            "-__v"
        );
        common.forEach(async (cron) => {
            let scheduleTimeHrs;

            if (cron.deliveryHours.autoArchiveTime.amPm === 'PM') {
                scheduleTimeHrs = (Number(cron.deliveryHours.autoArchiveTime.hours) === 12)
                    ? '12'
                    : (12 + Number(cron.deliveryHours.autoArchiveTime.hours) % 12).toString().padStart(2, '0');
            } else {
                scheduleTimeHrs = (Number(cron.deliveryHours.autoArchiveTime.hours) === 12)
                    ? '00'
                    : cron.deliveryHours.autoArchiveTime.hours;
            }

            const expression = `${cron.deliveryHours.autoArchiveTime.minutes} ${scheduleTimeHrs} * * *`

            manager.add(
                cron.createdAdminId,
                expression,
                async () => {
                    const response = await archiveOrders(cron.createdAdminId, cron.deliveryHours.timeZone)
                    console.log('response:', response);
                },
                {
                    start: true,
                    timeZone: cron.deliveryHours.timeZone
                }
            );
            console.log(`crons jobs running for: ${cron.createdAdminId}`);
        });
        console.log('crons resumed successfully!');
    } catch (e) {
        console.log(e);
    }
}


const scheduleCronsForArchive = async (req, res) => {
    try {
        const {
            amPm,
            hours,
            update,
            minutes,
            runCron,
            targetTimeZone,
            updateTimeZone,
            suddenArchive
        } = req.body

        const adminId = req.headers.adminid || "";
        console.log('hours:', hours);
        console.log('minutes:', minutes);
        console.log('amPm:', amPm);
        console.log('update:', update);
        console.log('runCron:', runCron);
        console.log('adminId:', adminId);
        console.log('updateTimeZone:', updateTimeZone);
        console.log('suddenArchive:', suddenArchive);
        if (suddenArchive) {
            await archiveOrders(adminId, targetTimeZone)
            console.log('sudden archive done');
            return res.json({ message: "sudden archive done for the running cron!" })
        }

        if (runCron) {

            let scheduleTimeHrs;

            if (amPm === 'PM') {
                scheduleTimeHrs = (Number(hours) === 12)
                    ? '12'
                    : (12 + Number(hours) % 12).toString().padStart(2, '0');
            } else {
                scheduleTimeHrs = (Number(hours) === 12)
                    ? '00'
                    : hours;
            }

            const expression = `${minutes} ${scheduleTimeHrs} * * *`

            if (update) {
                if (manager.exists(adminId)) {
                    if (updateTimeZone) {
                        manager.deleteJob(adminId)
                        console.log('updateTimeZone:', updateTimeZone);
                        console.log('newTimeZone:', targetTimeZone);
                        manager.add(
                            adminId,
                            expression,
                            async () => {
                                const response = await archiveOrders(adminId, targetTimeZone)
                                console.log('response:', response)
                            },
                            {
                                start: true,
                                timeZone: targetTimeZone
                            }
                        );
                        console.log(`current jobs are: ${manager}`);
                        return res.json({ message: "New timezone updated for the running cron!" })
                    } else {
                        manager.deleteJob(adminId)
                        manager.add(
                            adminId,
                            expression,
                            async () => {
                                const response = await archiveOrders(adminId, targetTimeZone)
                                console.log('response:', response)
                                console.log('cron ran successfully-1')
                            },
                            {
                                start: true,
                                timeZone: targetTimeZone
                            }
                        );
                        console.log(`current jobs are: ${manager}`);
                        return res.json({ message: 'requested cron updated successfully!' })
                    }
                }

                manager.add(
                    adminId,
                    expression,
                    async () => {
                        const response = await archiveOrders(adminId, targetTimeZone)
                        console.log('response:', response)
                        console.log('cron ran successfully-2')
                    },
                    {
                        start: true,
                        timeZone: targetTimeZone
                    }
                );
                return res.json({ message: 'cron job created successfully' })

            } else {

                manager.add(
                    adminId,
                    expression,
                    async () => {
                        const response = await archiveOrders(adminId, targetTimeZone)
                        console.log('response:', response)
                        console.log('cron ran successfully-3')
                    },
                    {
                        start: true,
                        timeZone: targetTimeZone
                    }
                );
                return res.send('cron job created successfully 2')
            }
        } else {
            manager.deleteJob(adminId)
            return res.json({ message: 'cron stopped' })
        }

    } catch (error) {
        console.log('error:', error);
        return res.send({ message: 'cron failed' })
    }
}

module.exports = {
    scheduleCronsForArchive,
    checkExistingCrons
}