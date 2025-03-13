import express from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createComment, createPost, getPosts, uploadPostPicture, getUserPosts, getFavoritePosts, editPost } from "../controllers/post.controller";
import { likePost } from "../controllers/post.controller";

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API endpoints for managing posts
 */

export const postRouter = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/posts");
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
    cb(null, `post-${uniqueSuffix}${ext}`);
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
 * /api/post:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved posts
 *       401:
 *         description: Unauthorized
 */
postRouter.get("/", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`GET post request for userId: ${authRequest.user.id}`);
  getPosts(authRequest, res);
});

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *                 description: The content of the post
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image (if any)
 *     responses:
 *       200:
 *         description: Post created successfully
 *       401:
 *         description: Unauthorized
 */
postRouter.post("/", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`POST create-post request for userId: ${authRequest.user.id}`);
  createPost(authRequest, res);
});

postRouter.put("/:postId", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`POST create-post request for userId: ${authRequest.user.id}`);
  editPost(authRequest, res);
});

/**
 * @swagger
 * /api/post/{postId}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post to like/unlike
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *       404:
 *         description: Post not found
 */
postRouter.post("/:postId/like", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`POST like request for userId: ${authRequest.user.id}, postId: ${req.params.postId}`);
  likePost(authRequest, res);
});

/**
 * @swagger
 * /api/post/favorites:
 *   get:
 *     summary: Get favorite posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved favorite posts
 *       401:
 *         description: Unauthorized
 */
postRouter.get("/favorites", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`GET favorite posts request for userId: ${authRequest.user.id}`);
  getFavoritePosts(authRequest, res);
});

/**
 * @swagger
 * /api/post/upload-image:
 *   post:
 *     summary: Upload an image for a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               postImage:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file type or size
 */
postRouter.post(
  "/upload-image",
  authMiddleware,
  (req, res, next) => {
    upload.single("postImage")(req, res, err => {
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
    console.log(`POST upload-post-picture request for userId: ${req.params.userId}`);
    uploadPostPicture(req as AuthenticatedRequest, res);
  }
);

/**
 * @swagger
 * /api/post/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The comment text
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       404:
 *         description: Post not found
 */
postRouter.post("/:postId/comment", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`POST create comment request for userId: ${authRequest.user.id}, postId: ${req.params.postId}`);
  createComment(authRequest, res);
});

/**
 * @swagger
 * /api/post/user/{userId}:
 *   get:
 *     summary: Get all posts by a user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user whose posts to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved user posts
 *       404:
 *         description: User not found
 */
postRouter.get("/user/:userId", authMiddleware, (req, res) => {
  console.log(`GET user posts request for userId: ${req.params.userId}`);
  getUserPosts(req as AuthenticatedRequest, res);
});
