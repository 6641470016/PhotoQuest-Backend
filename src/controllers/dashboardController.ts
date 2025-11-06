// backend/src/controllers/dashboardController.ts
import { Request, Response } from "express";
import { db } from "../db"; // mysql2 pool

interface AuthenticatedRequest extends Request {
  user?: { id: number; role: "admin" | "user" };
}

// ✅ Admin Dashboard
export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ดึงข้อมูลกระเป๋า admin (ยอดรวมในระบบ)
    const [rows]: any = await db.execute(
      "SELECT total_coins, total_revenue, updated_at FROM admin_wallet ORDER BY id DESC LIMIT 1"
    );

    const wallet = rows[0] || { total_coins: 0, total_revenue: 0, updated_at: null };

    res.json({
      message: "Welcome to Admin Dashboard",
      user: req.user,
      wallet,
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    res.status(500).json({ message: "Server error while fetching admin dashboard" });
  }
};

// ✅ User Dashboard
export const getUserDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [rows]: any = await db.execute(
      "SELECT id, display_name, email, coins FROM users WHERE id = ?",
      [userId]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
