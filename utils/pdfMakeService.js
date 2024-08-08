const Pdfmake = require("pdfmake");
const aws = require("aws-sdk");
const path = require("path");
const fs = require("fs");
const sanitize = require("sanitize-filename");
const axios = require("axios");
const { GeneralError } = require("./errors");
const {
  fonts,
  generateDocDefinition,
  generateOrderedItemsDocDefinition,
} = require("./pdfDocDefinition");

const spacesEndpoint = new aws.Endpoint(process.env.SPACES_ENDPOINT);
// const s3 = new aws.S3({
//   endpoint: spacesEndpoint,
//   accessKeyId: process.env.SPACES_ACCESS_KEY,
//   secretAccessKey: process.env.SPACES_SECRET_KEY,
// });

const s3 = new aws.S3({
  accessKeyId: process.env.BACBLAZE_ACCESS_KEY,
  secretAccessKey: process.env.BACKBLAZE_SECRET_KEY,
  endpoint: process.env.BACKBLAZE_ENDPOINT,
  region: process.env.BACKBLAZE_REGION,
});

let pdfmake = new Pdfmake(fonts);

const generateOrderPDF = (res, data, orderDate, pdfName, currencySymbol, adminId) => {
  let chunks = [];
  let pdfdoc = pdfmake.createPdfKitDocument(
    generateDocDefinition(data, orderDate, currencySymbol),
    {}
  );

  pdfdoc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  const pdfYear = orderDate?.split('/')[2].split(' ')[0]
  const pdfHours = orderDate?.split('/')[2].split(' ')[1].split(':')[0]
  const pdfMinutes = orderDate?.split('/')[2].split(' ')[1].split(':')[1]
  const pdfAmPm = orderDate?.split('/')[2].split(' ')[2]
  const pdfDownloadName = `${orderDate?.split('/')[0]}-${orderDate?.split('/')[1]}-${pdfYear}-${pdfHours}-${pdfMinutes}-${pdfAmPm}`
  console.log('orderDate:', pdfDownloadName);
  pdfdoc.on("end", () => {
    const result = Buffer.concat(chunks);
    if (process.env.STORE_IN_PROJECT == 'yes') {
      return res.status(200).json({
        message: "Pdf Created Successfully",
        pdfLocation: result,
        fileName: `${pdfName}-${pdfDownloadName}.pdf`
      });
    } else {
      const key = `branch-${adminId}/archived-orders/${pdfName}-${pdfDownloadName}.pdf`;
      console.log('key:', key);
      const params = {
        Key: `branch-${adminId}/archived-orders/${pdfName}-${pdfDownloadName}.pdf`,
        Body: result,
        ACL: "public-read",
        Bucket: process.env.BACKBLAZE_BUCKET_NAME,
        ContentType: "application/pdf",
      };

      s3.upload(params, async function (err, response) {
        if (err) {
          console.log("err", err);
          throw new GeneralError("An error occurred while uploading pdf");
        } else {

          const signedUrl = s3.getSignedUrl("getObject", {
            Key: key,
            Bucket: process.env.BACKBLAZE_BUCKET_NAME,
            Expires: 30,
          });

          const { data: pdfContent } = await axios.get(signedUrl, {
            responseType: 'arraybuffer',
          });
          console.log('pdfContent:', pdfContent);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');

          return res.status(200).json({
            message: "Pdf Created Successfully",
            pdfLocation: pdfContent,
            fileName: `${pdfName}-${pdfDownloadName}.pdf`
          });
        }
      });
    }
  });

  pdfdoc.end();
};

const generateOrderedItemsPDF = (res, data, orderDate, pdfName, currencySymbol, adminId) => {
  let chunks = [];
  let pdfdoc = pdfmake.createPdfKitDocument(
    generateOrderedItemsDocDefinition(data, orderDate, currencySymbol),
    {}
  );

  pdfdoc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  const pdfYear = orderDate?.split('/')[2].split(' ')[0]
  const pdfHours = orderDate?.split('/')[2].split(' ')[1].split(':')[0]
  const pdfMinutes = orderDate?.split('/')[2].split(' ')[1].split(':')[1]
  const pdfAmPm = orderDate?.split('/')[2].split(' ')[2]
  const pdfDownloadName = `${orderDate?.split('/')[0]}-${orderDate?.split('/')[1]}-${pdfYear}-${pdfHours}-${pdfMinutes}-${pdfAmPm}`
  console.log('orderDate:', pdfDownloadName);

  pdfdoc.on("end", () => {
    const result = Buffer.concat(chunks);

    if (process.env.STORE_IN_PROJECT == 'yes') {
      return res.status(200).json({
        message: "Pdf Created Successfully",
        pdfLocation: result,
        fileName: `${pdfName}-${pdfDownloadName}.pdf`
      });
    } else {
      const params = {
        Key: `branch-${adminId}/archived-items/${pdfName}-${pdfDownloadName}.pdf`,
        Body: result,
        ACL: "public-read",
        Bucket: process.env.BACKBLAZE_BUCKET_NAME,
        ContentType: "application/pdf",
      };

      s3.upload(params, async function (err, response) {
        if (err) {
          console.log("err", err);
          throw new GeneralError("An error occurred while uploading pdf");
        } else {

          const { data: pdfContent } = await axios.get(response.Location, {
            responseType: 'arraybuffer',
          });
          console.log('pdfContent:', pdfContent);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');

          return res.status(200).json({
            message: "Pdf Created Successfully",
            pdfLocation: pdfContent,
            fileName: `${pdfName}-${pdfDownloadName}.pdf`
          });
        }
      });
    }
  });

  pdfdoc.end();
};

module.exports = { generateOrderPDF, generateOrderedItemsPDF };
