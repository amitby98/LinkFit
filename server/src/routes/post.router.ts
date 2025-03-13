import express from "express";
import { getUserProfile, updateUserProfile, uploadProfilePicture } from "../controllers/user.controller";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createComment, createPost, getPosts, uploadPostPicture, getUserPosts, getFavoritePosts } from "../controllers/post.controller";
import { likePost } from "../controllers/post.controller";

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

postRouter.get("/", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`GET post request for userId: ${authRequest.user.id}`);
  getPosts(authRequest, res);
});

postRouter.post("/", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`POST create-post request for userId: ${authRequest.user.id}`);
  createPost(authRequest, res);
});

postRouter.post("/:postId/like", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`POST like request for userId: ${authRequest.user.id}, postId: ${req.params.postId}`);
  likePost(authRequest, res);
});

postRouter.get("/favorites", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`GET favorite posts request for userId: ${authRequest.user.id}`);
  getFavoritePosts(authRequest, res);
});

// Create a wrapper for handling multer errors
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

postRouter.post("/:postId/comment", authMiddleware, (req, res) => {
  const authRequest = req as AuthenticatedRequest;
  console.log(`POST create comment request for userId: ${authRequest.user.id}, postId: ${req.params.postId}`);
  createComment(authRequest, res);
});

postRouter.get("/user/:userId", authMiddleware, (req, res) => {
  console.log(`GET user posts request for userId: ${req.params.userId}`);
  getUserPosts(req as AuthenticatedRequest, res);
});
