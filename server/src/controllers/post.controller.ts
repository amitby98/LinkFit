import path from "path";
import mongoose from "mongoose";
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

export const editPost = async (req: AuthenticatedRequest, res: Response) => {
  console.log(`PUT edit-post request for userId: ${req.user.id}`);
  await PostModel.findByIdAndUpdate(req.params.postId, { body: req.body.body, image: req.body.imageUrl }).exec();

  res.status(200).json({ message: "Post edited successfully" });
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
    const { userId } = req.params;

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
export const likePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const postId = req.params.postId;

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      await PostModel.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
      });
    } else {
      await PostModel.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId },
      });
    }
    const updatedPost = await PostModel.findById(postId).populate("user", "username profilePicture");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    res.status(500).json({ message: "Failed to like/unlike post" });
  }
};
export const getFavoritePosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;

    // Find posts where the user has liked
    const favoritePosts = await PostModel.find({ likes: userId })
      .populate("user", "username profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(favoritePosts);
  } catch (error) {
    console.error("Error fetching favorite posts:", error);
    res.status(500).json({ message: "Failed to fetch favorite posts" });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own posts" });
    }

    await CommentsModel.deleteMany({ post: postId });

    await PostModel.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
