import "dotenv/config";
import app from "./app.js";
import connectDB from "./utils/db.js";

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err);
  process.exit(1);
});

const PORT = process.env.PORT || 1930;

await connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server started running on PORT ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDELED REJECTION! 💥 Shutting down...");
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
