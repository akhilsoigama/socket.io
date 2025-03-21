const { default: mongoose } = require("mongoose");
require('dotenv').config();
const MONGO_URI = process.env.MONGODB_URI;
console.log(MONGO_URI)
let isConnected = false;

const connectDB = async () => {
 
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'booster' });
    isConnected = true;
  } catch (error) {
    throw new Error('MongoDB connection failed');
  }
};

module.exports = connectDB;
