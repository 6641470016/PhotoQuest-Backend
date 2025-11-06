import { db } from "../db";

export interface IPhoto {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  quest_id?: number | null;
  file_url: string;
  likes?: number;
  votes?: number;
  approved?: number; // tinyint(1)
  created_at?: string;
}

export const PhotoModel = {
  // สร้าง photo ใหม่
  create: async (photo: IPhoto): Promise<number> => {
    const [result] = await db.query(
      "INSERT INTO photos (user_id, title, description, quest_id, file_url, likes, votes, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        photo.user_id,
        photo.title,
        photo.description || null,
        photo.quest_id || null,
        photo.file_url,
        photo.likes || 0,
        photo.votes || 0,
        photo.approved || 1,
      ]
    );
    // @ts-ignore
    return result.insertId;
  },

  // ดึง photo ทั้งหมด (optionally filter by quest_id)
  getAll: async (quest_id?: number): Promise<IPhoto[]> => {
    let sql = "SELECT * FROM photos";
    const params: any[] = [];
    if (quest_id) {
      sql += " WHERE quest_id = ?";
      params.push(quest_id);
    }
    sql += " ORDER BY created_at DESC";
    const [rows] = await db.query(sql, params);
    // @ts-ignore
    return rows;
  },

  // ดึง photo ตาม id
  getById: async (id: number): Promise<IPhoto | null> => {
    const [rows] = await db.query("SELECT * FROM photos WHERE id = ?", [id]);
    // @ts-ignore
    return rows.length > 0 ? rows[0] : null;
  },

  // ดึง photo ของ user
  getByUserId: async (user_id: number): Promise<IPhoto[]> => {
    const [rows] = await db.query("SELECT * FROM photos WHERE user_id = ? ORDER BY created_at DESC", [user_id]);
    // @ts-ignore
    return rows;
  },

  // อัพเดทจำนวน likes / votes
  updateStats: async (id: number, likes: number, votes: number) => {
    await db.query("UPDATE photos SET likes = ?, votes = ? WHERE id = ?", [likes, votes, id]);
  },

  // ลบ photo
  delete: async (id: number) => {
    await db.query("DELETE FROM photos WHERE id = ?", [id]);
  }
};
