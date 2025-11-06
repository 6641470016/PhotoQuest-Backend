// backend/src/controllers/packageController.ts
import { Request, Response } from "express";
import { db } from "../db";
import { IPackage } from "../models/packageModel";

interface AuthReq extends Request {
  file?: Express.Multer.File; // สำหรับ multer
}

// ✅ เพิ่ม Package ใหม่ (Admin)
export const addPackage = async (req: AuthReq, res: Response) => {
  try {
    const { name, coins, price, status } = req.body;
    const file = req.file;

    if (!name || !coins || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!file) {
      return res.status(400).json({ message: "QR file is required" });
    }

    const qr_url = `/uploads/qr/${file.filename}`;

    const pkg: IPackage = {
      name,
      coins: Number(coins),
      price: Number(price),
      qr_url,
      status: status || "active",
    };

    const [result]: any = await db.query(
      `INSERT INTO packages (name, coins, price, qr_url, status) VALUES (?, ?, ?, ?, ?)`,
      [pkg.name, pkg.coins, pkg.price, pkg.qr_url, pkg.status]
    );

    res.status(201).json({
      message: "Package created successfully",
      data: { id: result.insertId, ...pkg },
    });
  } catch (err: any) {
    console.error("❌ Error adding package:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ แสดงเฉพาะ active packages (ผู้ใช้ทั่วไป)
export const listActivePackages = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(`SELECT * FROM packages WHERE status='active'`);
    res.status(200).json(rows);
  } catch (err: any) {
    console.error("❌ Error fetching active packages:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ แสดงทุก package (Admin)
export const listAllPackages = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(`SELECT * FROM packages`);
    res.status(200).json(rows);
  } catch (err: any) {
    console.error("❌ Error fetching all packages:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ แก้ไข package (Admin)
export const updatePackage = async (req: AuthReq, res: Response) => {
  try {
    const { id, name, coins, price, status } = req.body;
    const file = req.file;

    if (!id) return res.status(400).json({ message: "Package ID is required" });

    const qr_url = file ? `/uploads/qr/${file.filename}` : undefined;

    await db.query(
      `UPDATE packages SET 
        name = COALESCE(?, name), 
        coins = COALESCE(?, coins), 
        price = COALESCE(?, price), 
        status = COALESCE(?, status), 
        qr_url = COALESCE(?, qr_url)
       WHERE id = ?`,
      [name, coins, price, status, qr_url, id]
    );

    res.json({ message: "Package updated successfully" });
  } catch (err: any) {
    console.error("❌ Error updating package:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ ลบ package (Admin)
export const deletePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Package ID is required" });

    await db.query(`DELETE FROM packages WHERE id = ?`, [id]);

    res.json({ message: "Package deleted successfully" });
  } catch (err: any) {
    console.error("❌ Error deleting package:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ Toggle status ของ package (Admin)
export const togglePackageStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Package ID is required" });

    // ดึง status ปัจจุบัน
    const [rows]: any = await db.query(`SELECT status FROM packages WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Package not found" });

    const currentStatus = rows[0].status;
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    await db.query(`UPDATE packages SET status = ? WHERE id = ?`, [newStatus, id]);

    res.json({ message: `Package status updated to ${newStatus}`, status: newStatus });
  } catch (err: any) {
    console.error("❌ Error toggling package status:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
