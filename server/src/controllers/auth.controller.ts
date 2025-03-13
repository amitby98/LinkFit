import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.model";
import bcrypt from "bcryptjs";

const signJwt = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

export const loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
  const { email, username } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // login

      const token = signJwt((existingUser as IUser)._id!.toString());
      res.status(201).json({ message: "User logged in successfully", token });
      return;
    }

    // register
    const newUser = new User({ username, email, authProvider: "google" });
    await newUser.save();
    const token = signJwt((newUser as IUser)._id!.toString());
    res.status(201).json({ message: "User registered successfully", token });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = signJwt((newUser as IUser)._id!.toString());
    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Please provide email and password" });
  }

  try {
    const userExists = await User.findOne({ email }).select("+password");
    if (!userExists) {
      res.status(404).json({ message: "Invalid email" });
    }
    if (userExists) {
      const isPasswordMatching = await userExists.comparePassword(password);
      if (isPasswordMatching) {
        const token = signJwt((userExists as IUser)._id!.toString());
        res.status(200).json({ token });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
