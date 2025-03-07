import express from "express";
import { getUserProfile, updateUserProfile, uploadProfilePicture } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";

export const userRouter = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile-pictures");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to only allow image uploads
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFileTypes = /jpeg|jpg|png|gif/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// User profile routes
userRouter.get("/profile/:userId", authMiddleware, getUserProfile);
userRouter.put("/update-profile/:userId", authMiddleware, updateUserProfile);
userRouter.post("/upload-profile-picture/:userId", authMiddleware, upload.single("profilePicture"), uploadProfilePicture);

// Register route for Google auth
userRouter.post("/register", (req, res) => {
  try {
    const { email, username, authProvider } = req.body;

    // Here you would typically check if the user already exists
    // If not, create the user in your database

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
