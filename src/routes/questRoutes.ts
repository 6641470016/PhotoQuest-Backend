// backend/src/routes/questRoutes.ts
import express from "express";
import {
  createQuest,
  updateQuest,
  deleteQuest,
  setQuestStatus,
  listQuests,
  listActiveQuests,
  getQuestById,
  joinQuest,
} from "../controllers/questController";
import { authenticateToken, authorizeAdmin } from "../middleware/authMiddleware";
import { db } from "../db";

const router = express.Router();

/* -------------------- Admin routes -------------------- */
router.post("/", authenticateToken, authorizeAdmin, createQuest);
router.put("/:id", authenticateToken, authorizeAdmin, updateQuest);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteQuest);
router.patch("/:id/status", authenticateToken, authorizeAdmin, setQuestStatus);

/* -------------------- User routes -------------------- */
// ✅ ดึงรายการ Quest ที่ผู้ใช้เข้าร่วมแล้ว ต้องอยู่ **ก่อน** /:id
router.get("/joined", authenticateToken, async (req, res) => {
  try {
    const user_id = (req as any).user.id;
    console.log("Fetching joined quests for user:", user_id);

    // แก้ไข: ดึง start_date และ end_date ด้วย
    const [rows] = await db.query(
      `SELECT q.id, q.title, q.description, q.start_date, q.end_date
       FROM quest_participants qp
       JOIN quests q ON q.id = qp.quest_id
       WHERE qp.user_id = ?`,
      [user_id]
    );

    console.log("Joined quests:", rows);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching joined quests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", authenticateToken, listQuests);
router.get("/active", authenticateToken, listActiveQuests);
router.get("/:id", authenticateToken, getQuestById);
router.post("/:id/join", authenticateToken, joinQuest);

export default router;
