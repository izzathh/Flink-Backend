const ElasticEmail = require("@elasticemail/elasticemail-client");

const defaultClient = ElasticEmail.ApiClient.instance;

const apikey = defaultClient.authentications["apikey"];
apikey.apiKey = process.env.ELASTIC_MAIL_API_KEY;

const api = new ElasticEmail.EmailsApi();

const email = ElasticEmail.EmailMessageData.constructFromObject({
  Recipients: [new ElasticEmail.EmailRecipient("aravindanr980@gmail.com")],
  Content: {
    Body: [
      ElasticEmail.BodyPart.constructFromObject({
        ContentType: "HTML",
        Content: "My test email content ;)",
      }),
    ],
    Subject: "JS EE lib test",
    From: "mystoreapp2@proton.me",
  },
});

const callback = function (error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log("API called successfully.");
  }
};

const sendElasticMail = async () => await api.emailsPost(email, callback);

module.exports = { sendElasticMail };
