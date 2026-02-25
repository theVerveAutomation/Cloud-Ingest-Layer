const cron = require('node-cron');
const { deleteSnapshots } = require("../services/db-queries");


function deleteOSnapshotsJob(cameras) {
    console.log('Running snapshot cleanup job...');

    cron.schedule('0 0 * * *', async () => {
        await deleteSnapshots(cameras);
    }); // Runs every day at midnight
}

module.exports = deleteOSnapshotsJob;