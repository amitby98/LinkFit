import { Request, Response } from "express";
import User from "../models/User.model";
import fs from "fs";
import path from "path";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Get user profile
export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { username, bio, profilePicture } = req.body;

    if (req.user.id !== userId) {
      res.status(403).json({ message: "Not authorized to update this profile" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Upload profile picture
export const uploadProfilePicture = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      res.status(403).json({ message: "Not authorized to update this profile" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const filePath = req.file.path;
    const fileName = path.basename(filePath);
    const baseUrl = process.env.BASE_URL || "http://localhost:3001";
    const imageUrl = `${baseUrl}/profile-pictures/${fileName}`;

    const user = await User.findById(userId);
    if (!user) {
      fs.unlinkSync(filePath);
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.profilePicture) {
      const oldFilePath = user.profilePicture.replace(`${baseUrl}/`, "");
      const fullOldPath = path.join(__dirname, "..", "..", oldFilePath);

      if (fs.existsSync(fullOldPath)) {
        fs.unlinkSync(fullOldPath);
      }
    }

    user.profilePicture = imageUrl;
    await user.save();

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all badges of a user
export const getUserBadges = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId).select("badges");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user.badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add a new badge to the user
export const addBadge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { badge } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const badgeExists = user.badges.some(b => b.level === badge.level);
    if (!badgeExists) {
      user.badges.push(badge);
      await user.save();
    }

    res.status(200).json(user.badges);
  } catch (error) {
    console.error("Error adding badge:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("username bio profilePicture");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users - new function
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Exclude password and select only necessary fields for display
    const users = await User.find().select("username profilePicture _id");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//  Get the user's progress
export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      completedDays: user.progress?.completedDays || 0,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//  Update the user's progress
export const updateUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { completedDays } = req.body;

    if (typeof completedDays !== "number" || completedDays < 0) {
      res.status(400).json({ message: "Invalid completedDays value" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.progress) {
      user.progress = { completedDays: 0 };
    }

    user.progress.completedDays = completedDays;
    await user.save();

    res.status(200).json({
      message: "Progress updated successfully",
      progress: user.progress,
    });
  } catch (error) {
    console.error("Error updating user progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};
