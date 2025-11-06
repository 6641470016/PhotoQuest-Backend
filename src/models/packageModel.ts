// backend/src/models/packageModel.ts
import { db } from "../db";

// ✅ โครงสร้างข้อมูล Package
export interface IPackage {
  id?: number;
  name: string;
  coins: number;
  price: number;
  qr_url: string;
  status?: "active" | "inactive";
  created_at?: Date;
  updated_at?: Date;
}

// ✅ เพิ่ม Package ใหม่
export const createPackage = async (pkg: IPackage): Promise<number> => {
  const [result]: any = await db.query(
    `INSERT INTO packages (name, coins, price, qr_url, status) VALUES (?, ?, ?, ?, ?)`,
    [pkg.name, pkg.coins, pkg.price, pkg.qr_url, pkg.status || "active"]
  );
  return result.insertId;
};

// ✅ ดึงเฉพาะ Package ที่สถานะ active
export const getActivePackages = async (): Promise<IPackage[]> => {
  const [rows]: any = await db.query(`SELECT * FROM packages WHERE status = 'active'`);
  return rows;
};

// ✅ ดึง Package ทั้งหมด (รวม inactive)
export const getAllPackages = async (): Promise<IPackage[]> => {
  const [rows]: any = await db.query(`SELECT * FROM packages`);
  return rows;
};
