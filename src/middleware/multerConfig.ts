import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * สร้าง storage ของ Multer สำหรับ folder ใดก็ได้
 * @param folderName ชื่อโฟลเดอร์ภายใต้ /uploads
 */
const createStorage = (folderName: string) => {
  const uploadDir = path.join(__dirname, `../../uploads/${folderName}`);

  // สร้างโฟลเดอร์อัตโนมัติถ้ายังไม่มี
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Upload folder created: ${uploadDir}`);
  }

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  });
};

// ✅ Export Multer instances สำหรับแต่ละประเภทไฟล์
export const uploadQR = multer({ storage: createStorage("qr") });
export const uploadPhoto = multer({ storage: createStorage("photos") });
export const uploadSlip = multer({ storage: createStorage("slips") });
