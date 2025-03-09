import {} from "express";

import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { login, register } from "../controllers/auth.controller";
import { getUserProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

dotenv.config();

export const authRouter = express.Router();

// Register
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/check", authMiddleware, getUserProfile);

// Protected route example
// router.get("/protected", authMiddleware, (req: Request, res: Response) => {
//   res.json({ message: "This is a protected route", user: req.user });
// });
