const { S3Client } = require("@aws-sdk/client-s3");
const AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  //   useAccelerateEndpoint: true,
});

const s3 = new AWS.S3({
  region: process.env.BUCKET_REGION,
  signatureVersion: "v4",
});

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: process.env.BUCKET_REGION,
  //   useAccelerateEndpoint: true,
});

module.exports = { s3, s3Client };
