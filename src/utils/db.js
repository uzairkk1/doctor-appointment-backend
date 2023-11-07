import mongoose from "mongoose";

export default async function () {
  try {
    const connection = await mongoose.connect(process.env.DB_URL);
    console.log("DB Connected successfully");
  } catch (error) {
    console.log("Something went wrong while connecting to DB: ", error);
  }
}
