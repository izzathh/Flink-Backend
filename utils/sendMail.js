const nodemailer = require("nodemailer");

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_FOR_NODE_MAILER,
    pass: process.env.PASSWORD_FOR_NODE_MAILER_MAIL,
  },
});

const sendMail = async (mailDetails) => {
  try {
    const { data } = await mailTransporter.sendMail(mailDetails);
    console.log("data", data);
  } catch (error) {
    console.log(error);
  }
};

// mailTransporter.sendMail(mailDetails, function (err, data) {
//   if (err) {
//     console.log("Error Occurs");
//   } else {
//     console.log("Email sent successfully");
//   }
// });

module.exports = { sendMail };
