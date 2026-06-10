"use strict";

import { prisma } from "./ledger.service.js";
import bcrypt from "bcryptjs";
import logger from "../config/logger.js";

export interface DriverRegisterData {
  firstname: string;
  lastname: string;
  matricNumber: string;
}

async function handleDriverRegister(
  terminalId: string,
  data: DriverRegisterData
) {
  const { firstname, lastname, matricNumber } = data;
  const log = logger.child({ terminalId, matricNumber });

  // Check if driver already exists
  const existing = await prisma.user.findUnique({
    where: { matricNumber: matricNumber.toUpperCase() },
  });

  if (existing) {
    log.warn("driver.already_registered");
    return {
      success: false,
      message: `${matricNumber} already registered`,
    };
  }

  const defaultPassword = `${matricNumber.replace(/\//g, "")}Driver!`;
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  await prisma.user.create({
    data: {
      firstname,
      lastname,
      email: `-`,
      matricNumber: matricNumber.toUpperCase(),
      password: hashedPassword,
      role: "DRIVER",
      isVerified: true,
    },
  });

  log.info({ firstname, lastname }, "driver.registered_from_terminal");

  return {
    success: true,
    message: `Driver ${firstname} ${lastname} registered`,
  };
}

async function handleDriverLogin(terminalId: string, driverUid: string) {
  const log = logger.child({ terminalId, driverUid });

  const driver = await prisma.user.findFirst({
    where: {
      matricNumber: driverUid.toUpperCase(),
      role: "DRIVER",
    },
    select: { id: true, firstname: true, lastname: true, matricNumber: true },
  });

  if (!driver) {
    log.warn("driver.not_found_or_not_driver_role");
    return { success: false, message: "Driver not recognised." };
  }

  await prisma.terminal.update({
    where: { terminal_id: terminalId },
    data: { active_driver_uid: driver.matricNumber },
  });

  log.info("driver.logged_into_terminal");

  return {
    success: true,
    message: `Welcome ${driver.firstname}`,
    driverName: `${driver.firstname} ${driver.lastname}`,
  };
}

async function handleDriverLogout(terminalId: string, driverUid: string) {
  const log = logger.child({ terminalId, driverUid });

  await prisma.terminal.update({
    where: { terminal_id: terminalId },
    data: { active_driver_uid: null },
  });

  log.info("driver.logged_out_of_terminal");
  return { success: true, message: "Driver logged out." };
}

export { handleDriverRegister, handleDriverLogin, handleDriverLogout };
