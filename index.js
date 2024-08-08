require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");
const connectToDB = require("./db/db.connections");
const userRoutes = require("./routes/user.router");
const cronRoutes = require("./routes/cron.router");
const itemRoutes = require("./routes/item.router");
const categoryRoutes = require("./routes/categories.router");
const orderRoutes = require("./routes/orders.router");
const commonFieldsRoutes = require("./routes/common.router");
const mappingRoutes = require("./routes/mapping.router");
const itemWrapperRoutes = require("./routes/itemWrapper.router");
const generatePdfRoutes = require("./routes/generatepdf.router");
const adminRoutes = require("./routes/admin.router");
const uploadMediaRoutes = require("./routes/upload.router");
const ceoRoutes = require("./routes/ceo.router");
const handleErrors = require("./middlewares/handleErrors");
const { checkExistingCrons } = require("./controllers/cron.controller");


app.use(cors());

app.use("/images/uploads/", express.static(__dirname + "/uploads/"));
app.use("/fonts/", express.static(__dirname + "/fonts/"));

app.use(express.json());

app.use(mongoSanitize({ dryRun: true }));

connectToDB();

app.use((req, res, next) => {
  console.log(req.url);
  next();
});


app.get("/api/v1/home", (req, res) => {
  res.send("Hello 👋🏻, I am from MyStore backend!");
});

const { exec } = require('child_process');

app.post('/stopNew', async (req, res) => {
  try {
    exec('pm2 start ecosystem.config.js --only Flink-grocery-old', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting Flink-grocery-old: ${error}`);
        return res.status(500).json({ error: 'Failed to start Flink-grocery-old.' });
      }
      exec('pm2 stop Flink-grocery', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error stoping Flink-grocery: ${error}`);
          return res.status(500).json({ error: 'Failed to stop Flink-grocery.' });
        }
        console.log('Applications Flink-grocery-old started and Flink-grocery stopped successfully.');
        return res.status(200).json({ message: 'Flink-grocery-old started and Flink-grocery stopped successfully.' });
      });
    });
  } catch (e) {
    console.log(e);
    return res.send('issue in restarting the server')
  }
})

// const addCreatedAdminId = async () => {
//   try {
//     let categories = await Category.find({});
//     const bulkUpdateData = categories.map((user) => ({
//       updateOne: {
//         filter: {
//           _id: user._id,
//         },
//         update: {
//           createdAdminId: "640d7e4ef44ef6ba1656afa6",
//         },
//       },
//     }));

//     await Category.bulkWrite(bulkUpdateData);
//   } catch (error) {
//     console.log(error);
//   }
// };
// addCreatedAdminId();
// Your main application file (e.g., app.js)


app.use("/api/v1", userRoutes);
app.use("/api/v1/cron-jobs", cronRoutes);
app.use("/api/v1/admin-actions", adminRoutes);
app.use("/api/v1/ceo-actions", ceoRoutes);
app.use("/api/v1/items", itemRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/common-fields", commonFieldsRoutes);
app.use("/api/v1/mappings", mappingRoutes);
app.use("/api/v1/itemWrapper", itemWrapperRoutes);
app.use("/api/v1/generate-pdf", generatePdfRoutes);
app.use("/api/v1/uploads", uploadMediaRoutes);

checkExistingCrons()

// app.post("/api/v1/cron", async (req, res) => {
//   const adminId = req.headers.adminid || "";
//   console.log('hours:', req.body.hours);
//   console.log('minutes:', req.body.minutes);
//   console.log('amPm:', req.body.amPm);
//   console.log('update:', req.body.update);
//   console.log('runCron:', req.body.runCron);
//   return res.send(true)
//   const task = await Task.findOne({ name: 'autoArchiveCron', createdAdminId: adminId });
//   const common = await Common.findOne({ createdAdminId: adminId }).select(
//     "-__v"
//   );
//   if (common.deliveryHours.autoArchiveTime.runCron) {
//     stopCronJob(common)
//     startCronJob(common)
//   } else if (!common.deliveryHours.autoArchiveTime.runCron && task?.isActive) {
//     stopCronJob(common)
//   }
//   return res.json({ common: common, message: "Cron status checked and updated." });
// });


app.use(handleErrors);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});