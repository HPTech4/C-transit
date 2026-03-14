import prisma from "../lib/prisma.js";

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("DB Connected Successfully");
  } catch (error) {
    console.error("Database Connection Error:", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };
export default connectDB;
