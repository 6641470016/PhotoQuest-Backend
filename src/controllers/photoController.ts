import { Request, Response } from "express";
import { db } from "../db";

export const PhotoController = {
  // ✅ อัพโหลดรูปภาพ
  uploadPhoto: async (req: Request, res: Response) => {
    try {
      const user_id = (req as any).user.id; // จาก token
      const { title, description, quest_id } = req.body;
      const file = req.file;

      if (!title || !file) {
        return res.status(400).json({ message: "Title and photo file are required" });
      }

      // 🔍 ถ้ามี quest_id ให้ตรวจสอบ
      if (quest_id) {
        // 1️⃣ ตรวจสอบว่ามี Quest นี้จริงไหม
        const [questRows] = await db.query("SELECT * FROM quests WHERE id = ?", [quest_id]);
        if ((questRows as any).length === 0) {
          return res.status(400).json({ message: "Quest not found" });
        }

        // 2️⃣ ตรวจสอบว่าผู้ใช้ได้เข้าร่วม Quest แล้วหรือยัง
        const [participantRows] = await db.query(
          "SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?",
          [quest_id, user_id]
        );
        if ((participantRows as any).length === 0) {
          return res.status(403).json({ message: "You must join this quest before uploading photos." });
        }
      }

      // ✅ บันทึกข้อมูลรูปภาพ
      const [result] = await db.query(
        `INSERT INTO photos (user_id, title, description, quest_id, file_url) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, title, description || null, quest_id || null, `/uploads/photos/${file.filename}`]
      );

      res.status(201).json({
        message: "Photo uploaded successfully",
        photo_id: (result as any).insertId,
      });
    } catch (err) {
      console.error("❌ uploadPhoto error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // ✅ ดึงรูปทั้งหมด (optionally filter by quest_id)
  getAllPhotos: async (req: Request, res: Response) => {
    try {
      const { quest_id } = req.query;
      let sql = `
        SELECT p.*, u.display_name AS user_name, q.title AS quest_title
        FROM photos p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN quests q ON q.id = p.quest_id
      `;
      const params: any[] = [];

      if (quest_id) {
        sql += " WHERE p.quest_id = ?";
        params.push(quest_id);
      }

      sql += " ORDER BY p.created_at DESC";

      const [rows] = await db.query(sql, params);
      res.json(rows);
    } catch (err) {
      console.error("❌ getAllPhotos error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // ✅ ดึงรูปของผู้ใช้ปัจจุบัน
  getUserPhotos: async (req: Request, res: Response) => {
    try {
      const user_id = (req as any).user.id;
      const [rows] = await db.query(
        "SELECT * FROM photos WHERE user_id = ? ORDER BY created_at DESC",
        [user_id]
      );
      res.json(rows);
    } catch (err) {
      console.error("❌ getUserPhotos error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // ✅ ดึง photo ตาม id
  getPhotoById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query(
        `
        SELECT p.*, u.display_name AS user_name, q.title AS quest_title
        FROM photos p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN quests q ON q.id = p.quest_id
        WHERE p.id = ?
      `,
        [id]
      );

      if ((rows as any).length === 0) {
        return res.status(404).json({ message: "Photo not found" });
      }

      res.json((rows as any)[0]);
    } catch (err) {
      console.error("❌ getPhotoById error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // ✅ ลบ photo (ตรวจสอบสิทธิ์)
  deletePhoto: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user_id = (req as any).user.id;
      const isAdmin = (req as any).user.role === "admin";

      const [rows] = await db.query("SELECT * FROM photos WHERE id = ?", [id]);
      if ((rows as any).length === 0) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const photo = (rows as any)[0];

      if (!isAdmin && photo.user_id !== user_id) {
        return res.status(403).json({ message: "Not authorized to delete this photo" });
      }

      await db.query("DELETE FROM photos WHERE id = ?", [id]);
      res.json({ message: "Photo deleted successfully" });
    } catch (err) {
      console.error("❌ deletePhoto error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
};
