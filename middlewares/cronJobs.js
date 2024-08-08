const moment = require('moment-timezone');
const cron = require("node-cron");
const Counter = require('../models/counter.model')
const Common = require("../models/common.model");
const Task = require('../models/cron.model');
const Order = require("../models/orders.model");
const CronJobManager = require('cron-job-manager');

function getTimezoneId(offset) {
    const offsetInMinutes = offset * 60;
    const timezoneId = moment.tz.guess(true) || 'UTC';
    const allTimezones = moment.tz.names();

    for (const tz of allTimezones) {
        if (moment.tz(tz).utcOffset() === offsetInMinutes && moment.tz(tz).isDST()) {
            return tz;
        } else if (moment.tz(tz).utcOffset() === offsetInMinutes) {
            return tz;
        }
    }
    return timezoneId;
}

let scheduledJob;
let manager;

// const jobMap = new Map();

const startCronJob = async (object) => {
    try {
        if (!scheduledJob) {

            const gmtOffset = object.deliveryHours.timeZoneOffset;
            const timezoneId = getTimezoneId(Number(gmtOffset));

            let scheduleTimeHrs = object.deliveryHours.autoArchiveTime.hours
            let scheduleTimeMins = object.deliveryHours.autoArchiveTime.minutes
            const isPm = object.deliveryHours.autoArchiveTime.amPm

            if (isPm === 'PM') {
                scheduleTimeHrs = (Number(object.deliveryHours.autoArchiveTime.hours) === 12)
                    ? '12'
                    : (12 + Number(object.deliveryHours.autoArchiveTime.hours) % 12).toString().padStart(2, '0');
            } else {
                scheduleTimeHrs = (Number(object.deliveryHours.autoArchiveTime.hours) === 12)
                    ? '00'
                    : object.deliveryHours.autoArchiveTime.hours;
            }

            const cronExpression = `00 ${Number(scheduleTimeMins)} ${Number(scheduleTimeHrs)} * * *`;
            scheduledJob = cron.schedule(cronExpression, async () => {
                const startTime = moment.tz(timezoneId);

                console.log(`Running cron at GMT+${gmtOffset}: ${timezoneId}`);
                const endTime = moment.tz(timezoneId);;
                const executionTime = endTime - startTime;
                const formattedEndTime = endTime.format('DD/MM/YYYY hh:mm A');
                console.log(`Cron job executed in ${executionTime} milliseconds at ${formattedEndTime}`);

                const existingTask = await Task.findOne({
                    name: 'autoArchiveCron',
                    createdAdminId: object.createdAdminId
                });
                existingTask.updateVal.archivedAt = formattedEndTime
                existingTask.save()

                const updatedDocument = await Order.updateMany(
                    existingTask.filter,
                    { $set: existingTask.updateVal },
                    { new: true }
                );

                const findCounter = await Counter.findOne({ createdAdminId: object.createdAdminId });
                findCounter.orderNumber = 0
                findCounter.save()

                if (!updatedDocument) {
                    return res.status(404).json({ message: "Data not found" });
                }
            }, {
                scheduled: true,
                timezone: timezoneId
            })

            // jobMap.set(object.createdAdminId, scheduledJob)

            const existingTask = await Task.findOne({
                name: 'autoArchiveCron',
                createdAdminId: object.createdAdminId
            });

            if (existingTask) {
                await Task.findOneAndUpdate(
                    { name: 'autoArchiveCron', createdAdminId: object.createdAdminId },
                    { isActive: true, cronExpression: cronExpression },
                    { upsert: true }
                );
            } else {
                await Task.create({
                    name: 'autoArchiveCron',
                    createdAdminId: object.createdAdminId,
                    cronExpression,
                    isActive: true,
                });
            }

            console.log('Cron job started:', cronExpression);
        }
    } catch (error) {
        console.log('Cron job error:', error);
    }
}

const stopCronJob = async (object) => {
    if (scheduledJob) {
        // const job = jobMap.get(object.createdAdminId)
        // if (!job) console.log('invalid cron job id.');
        // else job.stop()
        scheduledJob.stop();
        scheduledJob = null;
        console.log('Stopped cron job.');
    } else {
        console.log('No cron job is currently running.');
    }
}


// USE THIS-->
// const CronJobManager = require('cron-job-manager');

const jobManager = new CronJobManager();

const scheduleCronsForArchive = async () => {
    try {

        // const gmtOffset = object.deliveryHours.timeZoneOffset;
        const timezoneId = getTimezoneId(Number("5.5"));
        const cronKey = '65ae346173af9f0381521b37'

        let scheduleTimeHrs
        let scheduleTimeMins
        const isPm = 'AM'

        if (isPm === 'PM') {
            scheduleTimeHrs = (Number("12") === 12)
                ? '12'
                : (12 + Number("15") % 12).toString().padStart(2, '0');
        } else {
            scheduleTimeHrs = (Number("12") === 12)
                ? '00'
                : '13';
        }

        const cronExpression = `0 ${Number(scheduleTimeMins)} ${Number(scheduleTimeHrs)} * * *`;
        console.log('cronExpression:', cronExpression);

        jobManager.add(
            cronKey,
            cronExpression,
            () => { console.log('tick - what should be executed?') },
            {
                start: true,
                timeZone: timezoneId,
                onComplete: () => { console.log('a_key_string_to_call_this_job has stopped...'); },
            }
        );
        manager.start(cronKey);

        console.log('All cron jobs have been scheduled.');

    } catch (e) {
        console.log("scheduleCronsForArchive:", e);
    }
}

module.exports = { startCronJob, stopCronJob, scheduleCronsForArchive };
