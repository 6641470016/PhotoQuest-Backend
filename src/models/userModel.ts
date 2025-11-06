import { db } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export interface User {
  id?: number;
  email: string;
  password: string;
  display_name: string;
  role?: "admin" | "user";
  coins?: number;
}

export const createUser = async (user: User): Promise<number> => {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO users (email, password, display_name, role, coins) VALUES (?, ?, ?, ?, ?)",
    [user.email, user.password, user.display_name, user.role || "user", user.coins || 0]
  );
  return result.insertId;
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return (rows[0] as User) || undefined;
};

export const findUserById = async (id: number): Promise<User | undefined> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return (rows[0] as User) || undefined;
};
