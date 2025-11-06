import { Request, Response } from "express";
import { QuestModel, IQuest } from "../models/questModel";
import { db } from "../db";

interface AuthReq extends Request {
  user?: { id: number };
}

/* -------------------- Admin -------------------- */

// 🆕 สร้าง Quest ใหม่
export const createQuest = async (req: AuthReq, res: Response) => {
  try {
    const questData: IQuest = req.body;

    // ✅ ตรวจสอบข้อมูลที่จำเป็น
    if (
      !questData.title ||
      questData.entry_fee === undefined ||
      questData.reward_1 === undefined ||
      questData.reward_2 === undefined ||
      questData.reward_3 === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const id = await QuestModel.create({
      ...questData,
      status: questData.status || "open",
    });

    res.json({ message: "Quest created successfully", id });
  } catch (err: any) {
    console.error("❌ createQuest error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✏️ แก้ไข Quest
export const updateQuest = async (req: AuthReq, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid quest ID" });

    await QuestModel.update(id, req.body);
    res.json({ message: "Quest updated successfully" });
  } catch (err: any) {
    console.error("❌ updateQuest error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🗑️ ลบ Quest
export const deleteQuest = async (req: AuthReq, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid quest ID" });

    await QuestModel.delete(id);
    res.json({ message: "Quest deleted successfully" });
  } catch (err: any) {
    console.error("❌ deleteQuest error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔄 เปลี่ยนสถานะ Quest
export const setQuestStatus = async (req: AuthReq, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!id || !["open", "closed", "finished"].includes(status)) {
      return res.status(400).json({ message: "Invalid status or quest ID" });
    }

    await QuestModel.setStatus(id, status);
    res.json({ message: `Quest status updated to ${status}` });
  } catch (err: any) {
    console.error("❌ setQuestStatus error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------- User -------------------- */

// 📋 ดึง Quest ทั้งหมด (ทุกสถานะ)
export const listQuests = async (req: Request, res: Response) => {
  try {
    const quests = await QuestModel.getAll();
    res.json(quests);
  } catch (err: any) {
    console.error("❌ listQuests error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📋 ดึงเฉพาะ Quest ที่เปิดอยู่
export const listActiveQuests = async (req: Request, res: Response) => {
  try {
    const quests = await QuestModel.getAllActive();
    if (!quests || quests.length === 0) {
      return res.status(404).json({ message: "No active quests available" });
    }
    res.json(quests);
  } catch (err: any) {
    console.error("❌ listActiveQuests error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔍 ดึง Quest ตาม ID
export const getQuestById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid quest ID" });

    const quest = await QuestModel.getById(id);
    if (!quest) return res.status(404).json({ message: "Quest not found" });

    res.json(quest);
  } catch (err: any) {
    console.error("❌ getQuestById error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🙋‍♂️ ผู้ใช้เข้าร่วม Quest
export const joinQuest = async (req: AuthReq, res: Response) => {
  try {
    const questId = Number(req.params.id);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const quest = await QuestModel.getById(questId);
    if (!quest) return res.status(404).json({ message: "Quest not found" });
    if (quest.status !== "open") {
      return res.status(400).json({ message: "Quest is not open" });
    }

    const [rows]: any = await db.execute("SELECT coins FROM users WHERE id = ?", [userId]);
    const userCoins = rows[0]?.coins ?? 0;

    if (userCoins < (quest.entry_fee ?? 0)) {
      return res.status(400).json({ message: "Not enough coins to join this quest" });
    }

    // 💰 หัก coins ของผู้ใช้
    await db.execute("UPDATE users SET coins = coins - ? WHERE id = ?", [
      quest.entry_fee ?? 0,
      userId,
    ]);

    // 🧾 บันทึกการเข้าร่วม (กันซ้ำ)
    await db.execute(
      `INSERT IGNORE INTO quest_participants (quest_id, user_id, joined_at)
       VALUES (?, ?, NOW())`,
      [questId, userId]
    );

    res.json({ message: "Joined quest successfully" });
  } catch (err: any) {
    console.error("❌ joinQuest error:", err);
    res.status(500).json({ message: err.message });
  }
};
