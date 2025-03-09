import express from "express";
import { getUserProfile, updateUserProfile, uploadProfilePicture } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

export const userRouter = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/profile-pictures");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created upload directory:", uploadDir);
}

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use a more unique filename to avoid collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
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

// Add error handling for file uploads
const handleMulterErrors = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds the 5MB limit" });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// User profile routes with more descriptive logging
userRouter.get("/api/users/profile/:userId", authMiddleware, (req, res, next) => {
  console.log(`GET profile request for userId: ${req.params.userId}`);
  getUserProfile(req, res);
});

userRouter.put("/update-profile/:userId", authMiddleware, (req, res, next) => {
  console.log(`PUT update-profile request for userId: ${req.params.userId}`);
  updateUserProfile(req, res);
});

// Create a wrapper for handling multer errors
userRouter.post(
  "/upload-profile-picture/:userId",
  authMiddleware,
  (req, res, next) => {
    upload.single("profilePicture")(req, res, err => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File size exceeds the 5MB limit" });
          }
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else {
          return res.status(400).json({ message: err.message });
        }
      }
      next();
    });
  },
  (req, res) => {
    console.log(`POST upload-profile-picture request for userId: ${req.params.userId}`);
    uploadProfilePicture(req, res);
  }
);

// Register route for Google auth
userRouter.post("/register", (req, res) => {
  try {
    const { email, username, authProvider } = req.body;
    console.log("Register request:", { email, username, authProvider });

    // Here you would typically check if the user already exists
    // If not, create the user in your database

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Server error" });
  }
});
