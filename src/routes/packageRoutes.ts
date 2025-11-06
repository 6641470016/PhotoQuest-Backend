// backend/src/routes/packageRoutes.ts
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

import { 
  authenticateToken, 
  authorizeAdmin 
} from "../middleware/authMiddleware";

import { 
  addPackage, 
  listActivePackages, 
  listAllPackages, 
  updatePackage, 
  deletePackage,
  togglePackageStatus
} from "../controllers/packageController";

const router = express.Router();

// ✅ ตรวจสอบให้แน่ใจว่าโฟลเดอร์ uploads/qr มีอยู่จริง
const uploadDir = path.join(__dirname, "../../uploads/qr");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ ตั้งค่า multer สำหรับอัปโหลดรูป QR
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// ✅ ตรวจสอบเฉพาะไฟล์รูปภาพเท่านั้น
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({ storage, fileFilter });

// ✅ เส้นทาง API

// เพิ่ม package (Admin เท่านั้น)
router.post("/", authenticateToken, authorizeAdmin, upload.single("qr"), addPackage);

// แก้ไข package (Admin เท่านั้น)
router.put("/", authenticateToken, authorizeAdmin, upload.single("qr"), updatePackage);

// ลบ package (Admin เท่านั้น)
router.delete("/:id", authenticateToken, authorizeAdmin, deletePackage);

// Toggle status package (Admin)
router.patch("/:id/status", authenticateToken, authorizeAdmin, togglePackageStatus);

// แสดงเฉพาะ package ที่ active (ทุกคนที่ล็อกอินเข้าถึงได้)
router.get("/", authenticateToken, listActivePackages);

// แสดง package ทั้งหมด (Admin เท่านั้น)
router.get("/all", authenticateToken, authorizeAdmin, listAllPackages);

export default router;
