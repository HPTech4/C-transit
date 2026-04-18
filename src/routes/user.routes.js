import express from "express";
import {
  fetchUserCount,
  fetchAllUsers,
} from "../controller/user.controller.js";

const router = express.Router();

router.get("/count", fetchUserCount);
router.get("/", fetchAllUsers);

export default router;
