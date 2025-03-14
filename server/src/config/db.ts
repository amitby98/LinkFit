import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Database connection
const connectDB = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error("MONGO_URI is not defined in environment variables");
      }
      const conn = await mongoose.connect(mongoUri);
      resolve();

      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("Unknown error");
      }
      reject(error);
      process.exit(1);
    }
  });
};
export default connectDB;
