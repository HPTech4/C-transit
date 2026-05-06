import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";

const getUserCount = async () => {
  const count = await prisma.user.count();
  return count;
};

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      matricNumber: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });
  return users;
};


const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstname: true,
      lastname: true,

      kyc: {
        select: {
          studentId: true,
          phoneNumber: true,
          faceImageUrl: true,
        },
      },

      wallet: {
        select: {
          balance: true,
          is_linked: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    firstName: user.firstname,
    lastName: user.lastname,
    fullname: `${user.firstname} ${user.lastname}`,

    profilePicture: user.kyc?.faceImageUrl ?? null,

    kyc: user.kyc
      ? {
          studentId: user.kyc.studentId,
          phoneNumber: user.kyc.phoneNumber,
        }
      : null,

    wallet: user.wallet
      ? {
          balance: user.wallet.balance,
          isLinked: user.wallet.is_linked,
        }
      : null,
  };
};

const updateUserProfile = async (userId, data) => {
  const { firstname, lastname, phonenumber } = data;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(firstname && { firstname: firstname.trim() }),
        ...(lastname && { lastname: lastname.trim() }),
      },
    });

    if (phonenumber) {
      await tx.kyc.update({
        where: { userId },
        data: { phoneNumber: phonenumber.trim() },
      });
    }
  });

  return await getUserProfile(userId);
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password cannot be the same as the current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error("No account found with this email");
  }

  return user;
};

const resetPasswordWithOTP = async (email, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return user.id;
};

export {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserCount,
  getAllUsers,
  requestPasswordReset,
  resetPasswordWithOTP,
};