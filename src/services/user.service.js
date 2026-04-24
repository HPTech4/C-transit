import prisma from "../lib/prisma.js";

const getUserCount = async () => {
  const count = await prisma.user.count();
  return count;
};

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      matricNumber: true,
      createdAt: true,
    },
  });

  return users;
};

export { getUserCount, getAllUsers };