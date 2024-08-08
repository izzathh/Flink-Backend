const mongoose = require("mongoose");

const connectToDB = async () => {
  try {
    await mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected on ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
  }
};

module.exports = connectToDB;
