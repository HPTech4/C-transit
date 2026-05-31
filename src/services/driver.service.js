"use strict";

import { prisma } from "./ledger.service.js";
import logger from "../config/logger.js";

async function handleDriverLogin(terminalId, driverUid) {
  const log = logger.child({ terminalId, driverUid });

  // Verify driver exists and has DRIVER role
  const driver = await prisma.user.findFirst({
    where: {
      matricNumber: driverUid,
      role: "DRIVER",
    },
    select: { id: true, firstname: true, lastname: true, matricNumber: true },
  });

  if (!driver) {
    log.warn("driver.not_found_or_not_driver_role");
    return { success: false, message: "Driver not recognised." };
  }

  // Set active driver on terminal
  await prisma.terminal.update({
    where: { terminal_id: terminalId },
    data: { active_driver_uid: driverUid },
  });

  log.info("driver.logged_into_terminal");

  return {
    success: true,
    message: `Welcome ${driver.firstname}`,
    driverName: `${driver.firstname} ${driver.lastname}`,
  };
}

async function handleDriverLogout(terminalId, driverUid) {
  const log = logger.child({ terminalId, driverUid });

  await prisma.terminal.update({
    where: { terminal_id: terminalId },
    data: { active_driver_uid: null },
  });

  log.info("driver.logged_out_of_terminal");

  return { success: true, message: "Driver logged out." };
}

export { handleDriverLogin, handleDriverLogout };
