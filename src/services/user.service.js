import prisma from "../lib/prisma.js";

// Get total number of users
async function getUserCount() {
  const count = await prisma.user.count();
  return count;
}

// Get all users (optional, if you want list)
async function getAllUsers() {
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
}

export { getUserCount, getAllUsers };
