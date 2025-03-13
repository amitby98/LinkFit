import express from "express";
import { getUserProfile, updateUserProfile, uploadProfilePicture } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the user.
 *         username:
 *           type: string
 *           description: The user's username.
 *         bio:
 *           type: string
 *           description: A short bio about the user.
 *         profilePicture:
 *           type: string
 *           description: URL of the user's profile picture.
 *         email:
 *           type: string
 *           description: The user's email address.
 *       required:
 *         - id
 *         - username
 *         - email
 *
 *     UpdateUserProfile:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: The new username for the user.
 *         bio:
 *           type: string
 *           description: The new bio for the user.
 *         profilePicture:
 *           type: string
 *           description: The new profile picture URL for the user.
 *
 *     RegisterUser:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email.
 *         username:
 *           type: string
 *           description: The user's preferred username.
 *         authProvider:
 *           type: string
 *           description: The authentication provider used by the user (e.g., Google, Facebook).
 *       required:
 *         - email
 *         - username
 *         - authProvider
 *
 *     UploadResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Status message.
 *         imageUrl:
 *           type: string
 *           description: URL of the uploaded profile picture.
 */

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

/**
 * @swagger
 * /api/user/update-profile/{userId}:
 *   put:
 *     summary: Update a user's profile
 *     description: Allows an authenticated user to update their profile.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose profile is being updated.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfile'
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       403:
 *         description: Not authorized to update this profile.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
userRouter.put("/update-profile/:userId", authMiddleware, (req, res, next) => {
  console.log(`PUT update-profile request for userId: ${req.params.userId}`);
  updateUserProfile(req, res);
});

/**
 * @swagger
 * /api/user/upload-profile-picture/{userId}:
 *   post:
 *     summary: Upload a user's profile picture
 *     description: Allows an authenticated user to upload a profile picture.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user uploading the profile picture.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: The profile picture file to upload.
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       403:
 *         description: Not authorized to upload this profile picture.
 *       400:
 *         description: No file uploaded or invalid file type.
 *       500:
 *         description: Server error.
 */
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
