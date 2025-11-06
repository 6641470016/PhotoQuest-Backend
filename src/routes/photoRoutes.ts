// backend/src/routes/photoRoutes.ts
import express from "express";
import { uploadPhoto } from "../middleware/multerConfig";
import { authenticateToken } from "../middleware/authMiddleware";
import { db } from "../db";
import { RowDataPacket } from "mysql2/promise";

const router = express.Router();

// ==================== Photo CRUD ====================

// Upload photo
router.post("/", authenticateToken, uploadPhoto.single("photo"), async (req, res) => {
  const user_id = (req as any).user.id;
  const { title, description, quest_id } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "No file uploaded" });

  try {
    await db.query<RowDataPacket[]>(
      `INSERT INTO photos (user_id, title, description, quest_id, file_url)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, title, description, quest_id || null, file.filename]
    );
    res.json({ message: "Photo uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all photos (optionally filter by quest_id)
router.get("/", async (req, res) => {
  const quest_id = req.query.quest_id;
  try {
    let query = "SELECT * FROM photos";
    const params: any[] = [];
    if (quest_id) {
      query += " WHERE quest_id=?";
      params.push(quest_id);
    }
    const [rows] = await db.query<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get photos of logged-in user
router.get("/user", authenticateToken, async (req, res) => {
  const user_id = (req as any).user.id;
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM photos WHERE user_id=?",
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get photo by ID
router.get("/:id", async (req, res) => {
  const photo_id = req.params.id;
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM photos WHERE id=?",
      [photo_id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Photo not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete photo (user or admin)
router.delete("/:id", authenticateToken, async (req, res) => {
  const photo_id = req.params.id;
  const user_id = (req as any).user.id;

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT user_id FROM photos WHERE id=?",
      [photo_id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Photo not found" });

    if (rows[0].user_id !== user_id && !(req as any).user.is_admin)
      return res.status(403).json({ message: "Forbidden" });

    await db.query("DELETE FROM photos WHERE id=?", [photo_id]);
    res.json({ message: "Photo deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== Likes ====================

// Toggle like
router.post("/:id/like", authenticateToken, async (req, res) => {
  const photo_id = req.params.id;
  const user_id = (req as any).user.id;

  try {
    const [existing]: any = await db.query(
      "SELECT id FROM likes WHERE photo_id=? AND user_id=?",
      [photo_id, user_id]
    );

    if (existing.length > 0) {
      await db.query("DELETE FROM likes WHERE photo_id=? AND user_id=?", [photo_id, user_id]);
    } else {
      await db.query("INSERT INTO likes (photo_id, user_id) VALUES (?, ?)", [photo_id, user_id]);
    }

    const [countRows]: any = await db.query(
      "SELECT COUNT(*) as count FROM likes WHERE photo_id=?",
      [photo_id]
    );

    res.json({ count: countRows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get likes count
router.get("/:id/likes", async (req, res) => {
  const photo_id = req.params.id;
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM likes WHERE photo_id=?",
      [photo_id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== Comments ====================

// Add comment
router.post("/:id/comment", authenticateToken, async (req, res) => {
  const photo_id = req.params.id;
  const user_id = (req as any).user.id;
  const { comment } = req.body;

  try {
    await db.query(
      "INSERT INTO comments (photo_id, user_id, comment) VALUES (?, ?, ?)",
      [photo_id, user_id, comment]
    );
    res.json({ message: "Comment added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all comments with user_name
router.get("/:id/comments", async (req, res) => {
  const photo_id = req.params.id;
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT c.id, c.comment, c.created_at, u.display_name as user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.photo_id=?
       ORDER BY c.created_at ASC`,
      [photo_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
