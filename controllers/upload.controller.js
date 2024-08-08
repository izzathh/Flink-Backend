const {
  createS3SignedUrl,
  uploadImage,
} = require("../services/upload.service");

const getSignedUrl = async (req, res, next) => {
  try {
    // const data = await createS3SignedUrl(req.body);
    const data = await uploadImage(req);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSignedUrl };
