// backend/src/routes/transactionRoutes.ts
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken, authorizeAdmin } from "../middleware/authMiddleware";
import { 
  uploadSlip, 
  listPendingTopups, 
  approveTopup, 
  rejectTopup, 
  getUserTransactions 
} from "../controllers/transactionController";

const router = express.Router();

// Ensure upload folder exists
const uploadDir = path.join(__dirname, "../../uploads/slips");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

// File filter (allow only images)
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ========================= Routes =========================

// User upload slip (body: package_id)
router.post("/topup", authenticateToken, upload.single("slip"), uploadSlip);

// Admin: list pending top-ups
router.get("/pending", authenticateToken, authorizeAdmin, listPendingTopups);

// Admin: approve / reject top-up
router.patch("/:id/approve", authenticateToken, authorizeAdmin, approveTopup);
router.patch("/:id/reject", authenticateToken, authorizeAdmin, rejectTopup);

// User: view own transactions
router.get("/user", authenticateToken, getUserTransactions);

export default router;
