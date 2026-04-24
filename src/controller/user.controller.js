import { getUserCount, getAllUsers } from "../services/user.service.js";

export const fetchUserCount = async (req, res) => {
  try {
    const count = await getUserCount();

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("[fetchUserCount] Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user count",
    });
  }
};

export const fetchAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error("[fetchAllUsers] Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};
