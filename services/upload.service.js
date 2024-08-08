const moment = require("moment");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { s3, s3Client } = require("../utils/aws");
const { BadRequest } = require("../utils/errors");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const uploadToS3 = async (req) => {
  try {
    const { originalname, buffer, mimetype } = req.file;

    let newFileName = `${uuidv4()}-${originalname}`;
    let fileKey = `${newFileName}`;

    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: mimetype,
    };

    const command = new PutObjectCommand(params);

    await s3Client.send(command);
    return fileKey;
  } catch (error) {
    console.log(error);
  }
};

const getSignedUrlFromKey = async (imageKey) => {
  const getObjectParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: imageKey,
  };

  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3Client, command, { expiresIn: 10 * 60 });
  return url;
};

const createS3SignedUrl = async ({ fileName, uploadType, contentType }) => {
  let day = moment().format("YYYY-MM-DD");
  let newFileName = uuidv4() + path.extname(fileName);
  // let fileKey = `${uploadType}/${day}/${newFileName}`;
  let fileKey = `${newFileName}`;

  if (!contentType.match(/^image/))
    throw new BadRequest("only image, type is allowed");

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,
    Expires: 10 * 60,
    ContentType: contentType || "image/png",
  };

  let url = await s3.getSignedUrlPromise("putObject", params);
  return {
    url: url,
    fileKey: fileKey,
  };
};

module.exports = {
  createS3SignedUrl,
  getSignedUrlFromKey,
  uploadToS3,
};
