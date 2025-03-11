import path from "path";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import PostModel from "../models/Post.model";
import CommentsModel from "../models/Comments.model";

export const getPosts = async (req: AuthenticatedRequest, res: Response) => {
  console.log(`GET post request for userId: ${req.user.id}`);
  const posts = await PostModel.find()
    .populate("user", "username profilePicture")
    .populate({ path: "comments", populate: ["body", { path: "user", select: "username profilePicture" }] })
    .sort({ createdAt: -1 });
  res.status(200).json(posts);
};

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  console.log(`POST create-post request for userId: ${req.user.id}`);
  const newPost = new PostModel({
    user: req.user.id,
    body: req.body.body,
    image: req.body.imageUrl,
  });
  await newPost.save();

  res.status(200).json({ message: "Post created successfully" });
};

export const createComment = async (req: AuthenticatedRequest, res: Response) => {
  const newComment = new CommentsModel({
    user: req.user.id,
    post: req.params.postId,
    body: req.body.text,
  });
  await newComment.save();

  await PostModel.findByIdAndUpdate(req.params.postId, { $push: { comments: newComment._id } }).exec();

  res.status(200).json({ message: "Comment created successfully" });
};

export const uploadPostPicture = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Get the file path
    const filePath = req.file.path;
    const fileName = path.basename(filePath);

    // Create a public URL for the file
    const baseUrl = process.env.BASE_URL || "http://localhost:3001";
    const imageUrl = `${baseUrl}/posts/${fileName}`;

    res.status(200).json({
      message: "Post picture uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.userId;

    console.log(`Fetching posts for userId: ${userId}`);

    const posts = await PostModel.find({ user: userId })
      .populate("user", "username profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
};
