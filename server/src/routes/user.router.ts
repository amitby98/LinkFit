import express from "express";
import { getUserPublicProfile, updateUserProfile, uploadProfilePicture, addBadge, getUserBadges, getAllUsers, getUserProgress, updateUserProgress } from "../controllers/user.controller";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * @swagger
 * /api/user/all:
 *   get:
 *     summary: Get all users
 *     description: Returns a list of all users with basic information.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       500:
 *         description: Server error
 */
userRouter.get("/all", authMiddleware, getAllUsers);

/**
 * @swagger
 * /api/user/update-profile/{userId}:
 *   put:
 *     summary: Update a user's profile
 *     description: Allows an authenticated user to update their profile.
 */
userRouter.put("/update-profile/:userId", authMiddleware, (req, res) => updateUserProfile(req as AuthenticatedRequest, res));

/**
 * @swagger
 * /api/user/upload-profile-picture/{userId}:
 *   post:
 *     summary: Upload a user's profile picture
 */
userRouter.post(
  "/upload-profile-picture/:userId",
  authMiddleware,
  (req: any, res: any, next: any) => {
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
  (req, res) => uploadProfilePicture(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /api/user/{userId}/badges:
 *   get:
 *     summary: Get all badges of a user
 */
userRouter.get("/:userId/badges", authMiddleware, getUserBadges);

/**
 * @swagger
 * /api/user/badges:
 *   post:
 *     summary: Add a badge to the user
 */
userRouter.post("/badges", authMiddleware, (req, res) => addBadge(req as AuthenticatedRequest, res));

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get a user's public profile
 *     description: Returns public information about a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
userRouter.get("/:userId", authMiddleware, (req, res) => {
  console.log(`GET user profile request for userId: ${req.params.userId}`);
  getUserPublicProfile(req, res);
});
/////////////

/**
 * @swagger
 * /api/user/{userId}/progress:
 *   get:
 *     summary: Get user's progress
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User progress returned
 *       404:
 *         description: User not found
 */
userRouter.get("/:userId/progress", authMiddleware, getUserProgress);

/**
 * @swagger
 * /api/user/{userId}/progress:
 *   post:
 *     summary: Update user's progress
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completedDays:
 *                 type: number
 *                 description: Number of completed exercise days
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       404:
 *         description: User not found
 */
userRouter.post("/:userId/progress", authMiddleware, updateUserProgress);
