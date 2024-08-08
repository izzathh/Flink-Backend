const SibApiV3Sdk = require("sib-api-v3-sdk");

SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
  process.env.SIB_API_KEY;

const transporter = new SibApiV3Sdk.TransactionalEmailsApi();

const sendSIBMail = async (mailDetails) => {
  try {
    const { data } = await transporter.sendTransacEmail({
      ...mailDetails,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { sendSIBMail };
