const mongoose = require("mongoose");

let isMongoConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn("MONGO_URI not found. Running without MongoDB connection.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    isMongoConnected = true;
    console.log("MongoDB connected successfully.");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed. Falling back to in-memory mode.");
    return false;
  }
};

const getMongoStatus = () => isMongoConnected;

module.exports = { connectDB, getMongoStatus };
