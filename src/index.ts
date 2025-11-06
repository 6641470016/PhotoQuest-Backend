import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";

import dashboardRoutes from "./routes/dashboardRoutes";
import authRoutes from "./routes/authRoutes";
import packageRoutes from "./routes/packageRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import questRoutes from "./routes/questRoutes";
import photoRoutes from "./routes/photoRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use("/uploads/qr", express.static(path.join(process.cwd(), "uploads/qr")));
app.use("/uploads/slips", express.static(path.join(process.cwd(), "uploads/slips")));
app.use("/uploads/photos", express.static(path.join(process.cwd(), "uploads/photos")));

// API Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/photos", photoRoutes);

app.get("/", (req, res) => {
  res.send("🚀 PhotoQuest Backend API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
