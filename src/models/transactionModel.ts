// backend/src/models/transactionModel.ts
import { db } from "../db";

interface Transaction {
  user_id: number;
  package_id: number;
  type: "topup";
  amount: number;
  money: number;
  slip_url: string;
}

export const createTransaction = async (tx: Transaction): Promise<number> => {
  const [result]: any = await db.execute(
    `INSERT INTO transactions (user_id, type, amount, money, slip_url, package_id) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tx.user_id, tx.type, tx.amount, tx.money, tx.slip_url, tx.package_id]
  );
  return result.insertId;
};

export const getPendingTransactions = async () => {
  const [rows]: any = await db.execute(
    `SELECT t.*, u.display_name, u.email, p.name as package_name 
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     JOIN packages p ON t.package_id = p.id
     WHERE t.status='pending' AND t.type='topup'
     ORDER BY t.created_at DESC`
  );
  return rows;
};

export const getTransactionById = async (id: number) => {
  const [rows]: any = await db.execute(`SELECT * FROM transactions WHERE id = ?`, [id]);
  return rows[0];
};

export const updateTransactionStatus = async (id: number, status: "approved" | "rejected", approved_by?: number) => {
  await db.execute(
    `UPDATE transactions SET status = ?, approved_at = NOW(), approved_by = ? WHERE id = ?`,
    [status, approved_by || null, id]
  );
};
