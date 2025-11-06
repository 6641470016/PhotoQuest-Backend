// backend/src/controllers/transactionController.ts
import { Request, Response } from "express";
import { db } from "../db";
import path from "path";
import fs from "fs";
import { createTransaction, getPendingTransactions, getTransactionById, updateTransactionStatus } from "../models/transactionModel";

interface AuthReq extends Request { user?: any }

// User: Upload slip
export const uploadSlip = async (req: AuthReq, res: Response) => {
  try {
    const { package_id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No slip uploaded" });
    if (!package_id) return res.status(400).json({ message: "No package selected" });

    // Validate file type and size (max 5MB)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      // Delete invalid file
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Invalid file type" });
    }
    if (file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "File too large (max 5MB)" });
    }

    // Check package
    const [pRows]: any = await db.execute(
      "SELECT * FROM packages WHERE id = ? AND status='active'",
      [package_id]
    );
    const pkg = pRows[0];
    if (!pkg) return res.status(400).json({ message: "Invalid or inactive package" });

    const slipUrl = path.join("/uploads/slips", file.filename).replace(/\\/g, "/");

    const txId = await createTransaction({
      user_id: req.user.id,
      type: "topup",
      amount: pkg.coins,
      money: pkg.price,
      slip_url: slipUrl,
      package_id: pkg.id,
    });

    res.json({ message: "Slip uploaded, pending approval", transactionId: txId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: List pending top-ups
export const listPendingTopups = async (req: Request, res: Response) => {
  try {
    const list = await getPendingTransactions();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Approve top-up
export const approveTopup = async (req: AuthReq, res: Response) => {
  const conn = await db.getConnection(); // get raw connection for transaction
  await conn.beginTransaction();
  try {
    const id = Number(req.params.id);
    const tx = await getTransactionById(id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    if (tx.status !== "pending") return res.status(400).json({ message: "Transaction already processed" });

    const [pRows]: any = await conn.execute("SELECT * FROM packages WHERE id = ?", [tx.package_id]);
    const pkg = pRows[0];
    if (!pkg) return res.status(400).json({ message: "Package not found" });
    if (Number(tx.money) !== Number(pkg.price)) return res.status(400).json({ message: "Amount mismatch" });

    // Update user coins
    await conn.execute("UPDATE users SET coins = coins + ? WHERE id = ?", [tx.amount, tx.user_id]);

    // Update transaction
    await updateTransactionStatus(id, "approved", req.user?.id);

    // Update admin wallet
    await conn.execute(`
      INSERT INTO admin_wallet (id, total_coins, total_revenue)
      VALUES (1, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_coins = total_coins + VALUES(total_coins),
        total_revenue = total_revenue + VALUES(total_revenue)
    `, [tx.amount, tx.money]);

    await conn.commit();
    res.json({ message: "Top-up approved" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

// Admin: Reject top-up
export const rejectTopup = async (req: AuthReq, res: Response) => {
  try {
    const id = Number(req.params.id);
    const tx = await getTransactionById(id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    if (tx.status !== "pending") return res.status(400).json({ message: "Transaction already processed" });

    await updateTransactionStatus(id, "rejected", req.user?.id);
    res.json({ message: "Top-up rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// User: Get transactions
export const getUserTransactions = async (req: AuthReq, res: Response) => {
  try {
    const userId = req.user?.id;
    const [rows]: any = await db.execute(
      `SELECT t.*, p.name as package_name, p.coins as package_coins
       FROM transactions t
       LEFT JOIN packages p ON t.package_id = p.id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
