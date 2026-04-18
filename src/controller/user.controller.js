
import { getUserCount, getAllUsers } from "../services/user.service.js";

// GET /api/users/count
export const fetchUserCount = async (req, res) => {
  try {
    const count = await getUserCount();

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user count",
    });
  }
};

// GET /api/users
export const fetchAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};
