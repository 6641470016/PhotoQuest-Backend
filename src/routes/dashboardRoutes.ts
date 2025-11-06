// backend/src/routes/dashboardRoutes.ts
import express from "express";
import { authenticateToken, authorizeAdmin } from "../middleware/authMiddleware";
import { db } from "../db"; // mysql2 pool

const router = express.Router();

// ===================== Admin Dashboard =====================
router.get("/admin", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // ดึงข้อมูลจากตาราง admin_wallet (ยอดรวมทั้งระบบ)
    const [rows]: any = await db.execute(
      "SELECT total_coins, total_revenue, updated_at FROM admin_wallet ORDER BY id DESC LIMIT 1"
    );

    const wallet = rows[0] || { total_coins: 0, total_revenue: 0, updated_at: null };

    res.json({
      message: "Welcome Admin Dashboard!",
      wallet, // ✅ ส่งข้อมูลเหรียญและรายได้กลับไปด้วย
    });
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).json({ message: "Server error while loading admin dashboard" });
  }
});

// ===================== User Dashboard =====================
router.get("/user", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // ดึงข้อมูล user จากฐานข้อมูล
    const [rows]: any = await db.execute(
      "SELECT id, display_name, email, coins FROM users WHERE id = ?",
      [userId]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user); // ✅ ส่งข้อมูลจริงกลับไป
  } catch (err) {
    console.error("Error fetching user dashboard data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
