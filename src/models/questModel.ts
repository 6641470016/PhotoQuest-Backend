import { db } from "../db";

export interface IQuest {
  id?: number;
  title: string;
  description?: string;
  entry_fee?: number;
  reward_1?: number;
  reward_2?: number;
  reward_3?: number;
  total_pool?: number;
  status?: "open" | "closed" | "finished";
  start_date?: Date | null;
  end_date?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export class QuestModel {
  // 🆕 สร้าง Quest ใหม่
  static async create(quest: IQuest): Promise<number> {
    const [result]: any = await db.execute(
      `INSERT INTO quests 
       (title, description, entry_fee, reward_1, reward_2, reward_3, total_pool, status, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quest.title,
        quest.description ?? null,
        quest.entry_fee ?? 0,
        quest.reward_1 ?? 50,
        quest.reward_2 ?? 30,
        quest.reward_3 ?? 20,
        quest.total_pool ?? 0,
        quest.status ?? "open",
        quest.start_date ?? null,
        quest.end_date ?? null,
      ]
    );

    return result.insertId as number;
  }

  // 📋 ดึง Quest ทั้งหมด
  static async getAll(): Promise<IQuest[]> {
    const [rows] = await db.execute("SELECT * FROM quests ORDER BY created_at DESC");
    return rows as IQuest[];
  }

  // 📋 ดึงเฉพาะ Quest ที่เปิดอยู่
  static async getAllActive(): Promise<IQuest[]> {
    const [rows] = await db.execute(
      `SELECT * FROM quests 
       WHERE status = 'open' 
       ORDER BY start_date DESC`
    );
    return rows as IQuest[];
  }

  // 🔍 ดึง Quest ตาม ID
  static async getById(id: number): Promise<IQuest | null> {
    const [rows] = await db.execute("SELECT * FROM quests WHERE id = ?", [id]);
    const quests = rows as IQuest[];
    return quests.length > 0 ? quests[0] : null;
  }

  // ✏️ อัปเดต Quest
  static async update(id: number, quest: Partial<IQuest>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    for (const key in quest) {
      if (Object.prototype.hasOwnProperty.call(quest, key)) {
        fields.push(`${key} = ?`);
        // @ts-ignore
        values.push(quest[key]);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await db.execute(`UPDATE quests SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  // 🗑️ ลบ Quest
  static async delete(id: number): Promise<void> {
    await db.execute("DELETE FROM quests WHERE id = ?", [id]);
  }

  // 🔄 เปลี่ยนสถานะ Quest
  static async setStatus(id: number, status: "open" | "closed" | "finished"): Promise<void> {
    await db.execute("UPDATE quests SET status = ? WHERE id = ?", [status, id]);
  }
}
