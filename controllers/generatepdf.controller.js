const moment = require("moment");
const Common = require("../models/common.model");
const Order = require("../models/orders.model");
const Pdfmake = require("pdfmake");
const axios = require("axios");

const {
  generateOrderPDF,
  generateOrderedItemsPDF,
  generateZipOrderPDF
} = require("../utils/pdfMakeService");
const { format } = require("date-fns");
const { dateChecker } = require("../utils/dateChecker");
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const aws = require("aws-sdk");
const {
  generateDocDefinition,
  fonts,
  generateOrderedItemsDocDefinition,
  generateDocForTodays,
  generateOrderedItemsDocToday
} = require("../utils/pdfDocDefinition");
const commonModel = require("../models/common.model");
const adminModel = require("../models/admin.model");

let pdfmake = new Pdfmake(fonts);
const s3 = new aws.S3({
  accessKeyId: process.env.BACBLAZE_ACCESS_KEY,
  secretAccessKey: process.env.BACKBLAZE_SECRET_KEY,
  endpoint: process.env.BACKBLAZE_ENDPOINT,
  region: process.env.BACKBLAZE_REGION,
});

const getOrdersPDF = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const { archivedAt } = req.query

    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
    } = await dateChecker(adminId);

    let orders;

    if (
      moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
      moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    ) {
      orders = await Order.find({
        $and: [
          {
            createdAt: { $gte: startTimeToCheck },
          },
          {
            createdAt: { $lte: endTimeToCheck },
          },
        ],
      })
        .sort({ _id: -1 })
        .populate({
          path: "user",
          model: "User",
          select: {
            password: 0,
            updatedAt: 0,
            __v: 0,
          },
        });
    } else {
      orders = await Order.find({
        $and: [
          {
            createdAt: { $gte: endTimeToCheck },
          },
          {
            createdAt: { $lte: nextDayStartTime },
          },
        ],
      })
        .sort({ _id: -1 })
        .populate({
          path: "user",
          model: "User",
          select: {
            password: 0,
            updatedAt: 0,
            __v: 0,
          },
        });
    }

    orders = await Order.find({
      createdAdminId: adminId,
      archive: true,
      archivedAt: {
        $regex: new RegExp(moment(currentTimeToCheck).format('DD/MM/YYYY'), 'i'),
      }
    })
      .sort({ _id: -1 })
      .populate({
        path: "user",
        model: "User",
        select: {
          password: 0,
          updatedAt: 0,
          __v: 0,
        },
      });

    const pdfs = [];
    // console.log(orders:, orders);
    const generatePdfPromises = orders.map(async (order) => {
      const dateToBeParsed = `${order.createdAt}`;
      const pdfBuffer = await generatePdfBuffer(order, format(new Date(dateToBeParsed), "dd-MM-yyyy-hh-mm-ss-a"));
      pdfs.push({ data: pdfBuffer, name: `${format(new Date(dateToBeParsed), "dd-MM-yyyy-hh-mm-ss-a")}.pdf` });
    });

    await Promise.all(generatePdfPromises);

    const zipBuffer = await createZipBuffer(pdfs);
    if (process.env.STORE_IN_PROJECT == 'yes') {
      return res.status(200).json({
        message: "PDFs created and ZIP file uploaded successfully",
        pdfLocation: zipBuffer,
        fileName: `User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
      });
    }
    const s3Params = {
      Bucket: process.env.BACKBLAZE_BUCKET_NAME,
      Key: `branch-${adminId}/archived-orders-zip/User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`,
      Body: zipBuffer,
      ContentType: 'application/zip',
    };

    s3.upload(s3Params, async (err, response) => {
      if (err) {
        console.log("S3 upload error", err);
        throw new Error("An error occurred while uploading the ZIP file to S3");
      } else {

        const { data: pdfContent } = await axios.get(response.Location, {
          responseType: 'arraybuffer',
        });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'inline; filename="document.zip"');

        console.log("ZIP file uploaded to S3 successfully");
        return res.status(200).json({
          message: "PDFs created and ZIP file uploaded successfully",
          pdfLocation: pdfContent,
          fileName: `User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
        });
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

async function generatePdfBuffer(order, fileName) {
  return new Promise((resolve, reject) => {
    const pdfdoc = pdfmake.createPdfKitDocument(
      generateDocForTodays(order, fileName),
      {}
    );
    const chunks = [];
    pdfdoc.on("data", (chunk) => chunks.push(chunk));
    pdfdoc.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });
    pdfdoc.end();
  });
}

async function generateOrdersPdfBuffer(order, fileName, currencySymbol) {
  return new Promise((resolve, reject) => {
    const pdfdoc = pdfmake.createPdfKitDocument(
      generateDocDefinition(order, fileName, currencySymbol),
      {}
    );
    const chunks = [];
    pdfdoc.on("data", (chunk) => chunks.push(chunk));
    pdfdoc.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });
    pdfdoc.end();
  });
}

async function generatePdfBufferItems(order, fileName, currencySymbol) {
  return new Promise((resolve, reject) => {
    const pdfdoc = pdfmake.createPdfKitDocument(
      generateOrderedItemsDocToday(order, fileName, currencySymbol),
      {}
    );
    const chunks = [];
    pdfdoc.on("data", (chunk) => chunks.push(chunk));
    pdfdoc.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });
    pdfdoc.end();
  });
}

async function generateOrderedPdfBufferItems(order, fileName, currencySymbol) {
  return new Promise((resolve, reject) => {
    const pdfdoc = pdfmake.createPdfKitDocument(
      generateOrderedItemsDocDefinition(order, fileName, currencySymbol),
      {}
    );
    const chunks = [];
    pdfdoc.on("data", (chunk) => chunks.push(chunk));
    pdfdoc.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });
    pdfdoc.end();
  });
}

async function createZipBuffer(files) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip');
    const buffers = [];

    archive.on('data', (data) => buffers.push(data));

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('end', () => {
      const zipData = Buffer.concat(buffers);
      resolve(zipData);
    });

    files.forEach((file) => {
      archive.append(file.data, { name: file.name });
    });

    archive.finalize();
  });
}

const getOrderedItemsPDF = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";

    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
    } = await dateChecker(adminId);

    let items;

    if (
      moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
      moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    ) {
      items = await Order.find({
        $and: [
          {
            createdAt: { $gte: startTimeToCheck },
          },
          {
            createdAt: { $lte: endTimeToCheck },
          },
        ],
      })
        .sort({ _id: -1 })
        .select("items createdAt");
    } else {
      items = await Order.find({
        $and: [
          {
            createdAt: { $gte: endTimeToCheck },
          },
          {
            createdAt: { $lte: nextDayStartTime },
          },
        ],
      })
        .sort({ _id: -1 })
        .select("items createdAt");
    }

    const pdfs = [];
    const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')
    const generatePdfPromises = items.map(async (order) => {
      const dateToBeParsed = `${order.createdAt}`;
      const pdfBuffer = await generatePdfBufferItems(order, format(new Date(dateToBeParsed), "dd-MM-yyyy-hh-mm-ss-a"), currencySymbol.currency);
      pdfs.push({ data: pdfBuffer, name: `${format(new Date(dateToBeParsed), "dd-MM-yyyy-hh-mm-ss-a")}.pdf` });
    });

    await Promise.all(generatePdfPromises);

    const zipBuffer = await createZipBuffer(pdfs);
    if (process.env.STORE_IN_PROJECT == 'yes') {
      return res.status(200).json({
        message: "PDFs created and ZIP file uploaded successfully",
        pdfLocation: zipBuffer,
        fileName: `User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
      });
    }
    const s3Params = {
      Bucket: process.env.BACKBLAZE_BUCKET_NAME,
      Key: `branch-${adminId}/archived-items-zip/User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`,
      Body: zipBuffer,
      ContentType: 'application/zip',
    };

    s3.upload(s3Params, async (err, response) => {
      if (err) {
        console.log("S3 upload error", err);
        throw new Error("An error occurred while uploading the ZIP file to S3");
      } else {
        console.log("ZIP file uploaded to S3 successfully");
        const { data: pdfContent } = await axios.get(response.Location, {
          responseType: 'arraybuffer',
        });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'inline; filename="document.zip"');
        return res.status(200).json({
          message: "PDFs created and ZIP file uploaded successfully",
          pdfLocation: pdfContent,
          fileName: `User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
        });
      }
    });

    // generateOrderedItemsPDF(
    //   res,
    //   items,
    //   format(new Date(endTimeToCheck), "dd/MM/yyyy"),
    //   "ordered-items"
    // );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getTodaysOrdersByDatePDF = async (req, res, next) => {
  try {
    const { archivedOrderDate, date1 } = req.body;
    const adminId = req.headers.adminid || "";
    const dateToBeParsed = `${date1}`;

    const orders = await Order.find({
      createdAdminId: adminId,
      archive: true,
      archivedAt: { $eq: dateToBeParsed },
    })
      .populate({
        path: "user",
        model: "User",
        select: {
          password: 0,
          updatedAt: 0,
          __v: 0,
        },
      })
      .exec();
    const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')
    generateOrderPDF(
      res,
      orders,
      archivedOrderDate,
      "archived-orders",
      currencySymbol.currency,
      adminId
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getArchivedOrdersByDatePDF = async (req, res, next) => {
  try {
    const { archivedOrderDate, date1 } = req.body;
    const adminId = req.headers.adminid || "";
    const common = await Common.find({ createdAdminId: adminId });
    const dateToBeParsed = `${date1}`;

    const startTime = moment(common[0].deliveryHours.deliveryStartTime)
      .utc()
      .format("HH:mm:ss");

    const addEndTimeToDate = moment(dateToBeParsed)
      .utc()
      .hour(startTime.split(":")[0])
      .minute(startTime.split(":")[1])
      .second(startTime.split(":")[2])
      .format();

    const endTime = moment(common[0].deliveryHours.deliveryEndTime)
      .utc()
      .format("HH:mm:ss");

    const addStartTimeToDate = moment(dateToBeParsed)
      .utc()
      .subtract("1", "day")
      .hour(endTime.split(":")[0])
      .minute(endTime.split(":")[1])
      .second(endTime.split(":")[2])
      .format();

    const orders = await Order.find({
      $and: [
        { archivedAt: archivedOrderDate },
        { archive: true },
        { createdAdminId: adminId },
      ],
    })
      .populate({
        path: "user",
        model: "User",
        select: {
          password: 0,
          updatedAt: 0,
          __v: 0,
        },
      })
      .exec();
    const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')

    await generateOrderPDF(
      res,
      orders,
      archivedOrderDate,
      "archived-orders",
      currencySymbol.currency,
      adminId
    );

  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getGenerateOrderPDF = (req, res) => {
  try {
    const requestedFileName = req.params.filename;
    const filePath = path.join('../utils/pdfs', requestedFileName);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).send('File not found');
      }
      res.sendFile(filePath);
    });
  } catch (error) {
    console.log('error:', error);
  }
}

const getArchivedOrdersPDF = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const orders1 = await Order.aggregate([
      {
        $match: {
          createdAdminId: adminId,
          archive: true,
        },
      },
      {
        $group: {
          // _id: {
          //   $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          // },
          _id: "$archivedAt"
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);


    const parseDate = (dateString) => {
      if (dateString?.includes(' ') !== false) {
        const [datePart, timePart, ampm] = dateString != null
          ? dateString.split(' ')
          : [null, null, null]
        const [day, month, year] = datePart != null ? datePart.split('/') : [null, null, null];
        const [hours, minutes] = timePart != null ? timePart.split(':') : [null, null];
        const isPM = ampm === 'PM';

        let hour = parseInt(hours, 10);

        if (isPM && hour < 12) {
          hour += 12;
        }

        const formattedDateString = `${year}-${month}-${day} ${hour}:${minutes}`;
        return new Date(formattedDateString);
      }
    };

    orders1.sort((a, b) => parseDate(b._id) - parseDate(a._id));

    const pdfs = [];
    const generatePdfPromises = orders1.map(async (order) => {
      const dateToBeParsed = order._id;

      // const startTime = moment(common[0].deliveryHours.deliveryStartTime)
      //   .utc()
      //   .format("HH:mm:ss");

      // const addEndTimeToDate = moment(dateToBeParsed)
      //   .utc()
      //   .hour(startTime.split(":")[0])
      //   .minute(startTime.split(":")[1])
      //   .second(startTime.split(":")[2])
      //   .format();

      // const endTime = moment(common[0].deliveryHours.deliveryEndTime)
      //   .utc()
      //   .format("HH:mm:ss");

      // const addStartTimeToDate = moment(dateToBeParsed)
      //   .utc()
      //   .subtract(1, "day")
      //   .hour(endTime.split(":")[0])
      //   .minute(endTime.split(":")[1])
      //   .second(endTime.split(":")[2])
      //   .format();
      let pdfDownloadName = ""
      if (dateToBeParsed?.includes(' ') !== false) {
        const pdfYear = dateToBeParsed?.split('/')[2].split(' ')[0]
        const pdfHours = dateToBeParsed?.split('/')[2].split(' ')[1].split(':')[0]
        const pdfMinutes = dateToBeParsed?.split('/')[2].split(' ')[1].split(':')[1]
        const pdfAmPm = dateToBeParsed?.split('/')[2].split(' ')[2]
        pdfDownloadName = `${dateToBeParsed?.split('/')[0]}-${dateToBeParsed?.split('/')[1]}-${pdfYear}-${pdfHours}-${pdfMinutes}-${pdfAmPm}`
      }

      const orders = await Order.find({
        $and: [
          // {
          //   createdAt: { $gte: addStartTimeToDate },
          // },
          // {
          //   createdAt: { $lte: addEndTimeToDate },
          // },
          { archivedAt: dateToBeParsed },
          { archive: true },
          { createdAdminId: adminId },
        ],
      }).populate({
        path: "user",
        model: "User",
        select: {
          password: 0,
          updatedAt: 0,
          __v: 0,
        },
      });
      const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')

      const pdfBuffer = await generateOrdersPdfBuffer(orders, dateToBeParsed, currencySymbol.currency);
      pdfs.push({ data: pdfBuffer, name: `${pdfDownloadName}.pdf` });
    });

    await Promise.all(generatePdfPromises);
    const zipFile = await createZipFile(pdfs);
    if (process.env.STORE_IN_PROJECT == 'yes') {
      return res.status(200).json({
        message: "PDFs created and ZIP file uploaded successfully",
        pdfLocation: zipFile,
        fileName: `User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
      });
    } else {
      const s3Params = {
        Bucket: process.env.BACKBLAZE_BUCKET_NAME,
        Key: `branch-${adminId}/archived-orders-zip/User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`,
        Body: zipFile,
        ContentType: 'application/zip',
      };
      s3.upload(s3Params, async (err, response) => {
        if (err) {
          console.log("S3 upload error", err);
          throw new Error("An error occurred while uploading the ZIP file to S3");
        } else {
          console.log("ZIP file uploaded to S3 successfully");
          const { data: pdfContent } = await axios.get(response.Location, {
            responseType: 'arraybuffer',
          });
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', 'inline; filename="document.zip"');

          return res.status(200).json({
            message: "PDFs created and ZIP file uploaded successfully",
            pdfLocation: pdfContent,
            fileName: `User-orders-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
          });
        }
      });
    }
    function createZipFile(files) {
      return new Promise((resolve, reject) => {
        const archive = archiver('zip');
        const buffers = [];

        archive.on('data', (data) => buffers.push(data));

        archive.on('error', (err) => {
          reject(err);
        });

        archive.on('end', () => {
          const zipData = Buffer.concat(buffers);
          resolve(zipData);
        });

        files.forEach((file) => {
          archive.append(file.data, { name: file.name });
        });

        archive.finalize();
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getArchivedOrderedItemsPDF = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const orders1 = await Order.aggregate([
      {
        $match: {
          createdAdminId: adminId,
          archive: true,
        },
      },
      {
        $group: {
          // _id: {
          //   $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          // },
          _id: "$archivedAt"
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const parseDate = (dateString) => {
      if (dateString?.includes(' ') !== false) {
        const [datePart, timePart, ampm] = dateString != null
          ? dateString.split(' ')
          : [null, null, null]
        const [day, month, year] = datePart != null ? datePart.split('/') : [null, null, null];
        const [hours, minutes] = timePart != null ? timePart.split(':') : [null, null];
        const isPM = ampm === 'PM';

        let hour = parseInt(hours, 10);

        if (isPM && hour < 12) {
          hour += 12;
        }

        const formattedDateString = `${year}-${month}-${day} ${hour}:${minutes}`;
        return new Date(formattedDateString);
      }
    };

    orders1.sort((a, b) => parseDate(b._id) - parseDate(a._id));

    const pdfs = [];
    const generatePdfPromises = orders1.map(async (order) => {
      const dateToBeParsed = order._id;

      // const startTime = moment(common[0].deliveryHours.deliveryStartTime)
      //   .utc()
      //   .format("HH:mm:ss");

      // const addEndTimeToDate = moment(dateToBeParsed)
      //   .utc()
      //   .hour(startTime.split(":")[0])
      //   .minute(startTime.split(":")[1])
      //   .second(startTime.split(":")[2])
      //   .format();

      // const endTime = moment(common[0].deliveryHours.deliveryEndTime)
      //   .utc()
      //   .format("HH:mm:ss");

      // const addStartTimeToDate = moment(dateToBeParsed)
      //   .utc()
      //   .subtract(1, "day") // Remove quotes around 1
      //   .hour(endTime.split(":")[0])
      //   .minute(endTime.split(":")[1])
      //   .second(endTime.split(":")[2])
      //   .format();
      let pdfDownloadName = ""
      if (dateToBeParsed?.includes(' ') !== false) {
        const pdfYear = dateToBeParsed?.split('/')[2].split(' ')[0]
        const pdfHours = dateToBeParsed?.split('/')[2].split(' ')[1].split(':')[0]
        const pdfMinutes = dateToBeParsed?.split('/')[2].split(' ')[1].split(':')[1]
        const pdfAmPm = dateToBeParsed?.split('/')[2].split(' ')[2]
        pdfDownloadName = `${dateToBeParsed?.split('/')[0]}-${dateToBeParsed?.split('/')[1]}-${pdfYear}-${pdfHours}-${pdfMinutes}-${pdfAmPm}`
      }

      const orders = await Order.find({
        $and: [
          // {
          //   createdAt: { $gte: addStartTimeToDate },
          // },
          // {
          //   createdAt: { $lte: addEndTimeToDate },
          // },
          { archivedAt: dateToBeParsed },
          { archive: true },
          { createdAdminId: adminId },
        ],
      }).populate({
        path: "user",
        model: "User",
        select: {
          password: 0,
          updatedAt: 0,
          __v: 0,
        },
      });
      const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')

      const pdfBuffer = await generateOrderedPdfBufferItems(orders, dateToBeParsed, currencySymbol.currency);
      pdfs.push({ data: pdfBuffer, name: `${pdfDownloadName}.pdf` });

    });

    await Promise.all(generatePdfPromises);
    const zipFile = await createZipFile(pdfs);
    if (process.env.STORE_IN_PROJECT == 'yes') {
      return res.status(200).json({
        message: "PDFs created and ZIP file uploaded successfully",
        pdfLocation: zipFile,
        fileName: `Ordered-items-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
      });
    } else {
      const s3Params = {
        Bucket: process.env.BACKBLAZE_BUCKET_NAME,
        Key: `branch-${adminId}/archived-items-zip/Ordered-items-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`,
        Body: zipFile,
        ContentType: 'application/zip',
      };
      s3.upload(s3Params, async (err, response) => {
        if (err) {
          console.log("S3 upload error", err);
          throw new Error("An error occurred while uploading the ZIP file to S3");
        } else {

          console.log("ZIP file uploaded to S3 successfully");

          const { data: pdfContent } = await axios.get(response.Location, {
            responseType: 'arraybuffer',
          });
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', 'inline; filename="document.zip"');

          return res.status(200).json({
            message: "PDFs created and ZIP file uploaded successfully",
            pdfLocation: pdfContent,
            fileName: `Ordered-items-${format(new Date(), "dd-MM-yyyy-hh-mm-ss-a")}.zip`
          });
        }
      });
    }
    function createZipFile(files) {
      return new Promise((resolve, reject) => {
        const archive = archiver('zip');
        const buffers = [];

        archive.on('data', (data) => buffers.push(data));

        archive.on('error', (err) => {
          reject(err);
        });

        archive.on('end', () => {
          const zipData = Buffer.concat(buffers);
          resolve(zipData);
        });

        files.forEach((file) => {
          archive.append(file.data, { name: file.name });
        });

        archive.finalize();
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getTodaysOrderesItemByDatePDF = async (req, res, next) => {
  try {
    const { _id, archivedOrderDate } = req.body;
    const adminId = req.headers.adminid || "";

    const items = await Order.find({
      $and: [
        { archivedAt: archivedOrderDate ? archivedOrderDate : null },
        { archive: true },
        { createdAdminId: adminId },
      ],
    }).select("items currency");
    const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')
    generateOrderedItemsPDF(
      res,
      items,
      archivedOrderDate,
      "archived-ordered-items",
      currencySymbol.currency,
      adminId
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getArchivedOrderedItemsByDatePDF = async (req, res, next) => {
  try {
    const { archivedOrderDate, date1 } = req.body;
    const adminId = req.headers.adminid || "";
    const common = await Common.find({ createdAdminId: adminId });
    const dateToBeParsed = `${date1}`;

    const startTime = moment(common[0].deliveryHours.deliveryStartTime)
      .utc()
      .format("HH:mm:ss");

    const addEndTimeToDate = moment(dateToBeParsed)
      .utc()
      .hour(startTime.split(":")[0])
      .minute(startTime.split(":")[1])
      .second(startTime.split(":")[2])
      .format();

    const endTime = moment(common[0].deliveryHours.deliveryEndTime)
      .utc()
      .format("HH:mm:ss");

    const addStartTimeToDate = moment(dateToBeParsed)
      .utc()
      .subtract("1", "day")
      .hour(endTime.split(":")[0])
      .minute(endTime.split(":")[1])
      .second(endTime.split(":")[2])
      .format();

    const items = await Order.find({
      $and: [
        // {
        //   createdAt: { $gte: addStartTimeToDate },
        // },
        // {
        //   createdAt: { $lte: addEndTimeToDate },
        // },
        { archivedAt: archivedOrderDate ? archivedOrderDate : null },
        { archive: true },
        { createdAdminId: adminId },
      ],
    }).select("items currency");

    const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')

    generateOrderedItemsPDF(
      res,
      items,
      archivedOrderDate,
      "archived-ordered-items",
      currencySymbol.currency,
      adminId
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  getOrdersPDF,
  getOrderedItemsPDF,
  getGenerateOrderPDF,
  getArchivedOrdersPDF,
  getArchivedOrderedItemsPDF,
  getTodaysOrderesItemByDatePDF,
  getArchivedOrdersByDatePDF,
  getTodaysOrdersByDatePDF,
  getArchivedOrderedItemsByDatePDF,
};
