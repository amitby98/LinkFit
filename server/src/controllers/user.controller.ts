import { Request, Response } from "express";
import User from "../models/User.model";
import fs from "fs";
import path from "path";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Ensure the user is accessing their own profile
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

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

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { username, bio, profilePicture } = req.body;

    // Ensure the user is updating their own profile
    if ((req as AuthenticatedRequest).user.id !== userId) {
      res.status(403).json({ message: "Not authorized to update this profile" });
      return;
    }

    // Find the user and update
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update user details
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Ensure the user is updating their own profile
    if ((req as AuthenticatedRequest).user.id !== userId) {
      res.status(403).json({ message: "Not authorized to update this profile" });
      return;
    }

    // Check if a file was uploaded
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Get the file path
    const filePath = req.file.path;
    console.log({ filePath, basename: path.basename(filePath) });
    const fileName = path.basename(filePath);

    // Create a public URL for the file
    const baseUrl = process.env.BASE_URL || "http://localhost:3001";
    const imageUrl = `${baseUrl}/profile-pictures/${fileName}`;

    // Update the user's profile picture in the database
    const user = await User.findById(userId);

    if (!user) {
      // Remove the uploaded file if user not found
      fs.unlinkSync(filePath);
      res.status(404).json({ message: "User not found" });
      return;
    }

    // If user already had a profile picture, delete the old one
    if (user.profilePicture) {
      const oldFilePath = user.profilePicture.replace(`${baseUrl}/`, "");
      const fullOldPath = path.join(__dirname, "..", "..", oldFilePath);

      if (fs.existsSync(fullOldPath)) {
        fs.unlinkSync(fullOldPath);
      }
    }

    // Update with new profile picture
    user.profilePicture = imageUrl;
    await user.save();

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
