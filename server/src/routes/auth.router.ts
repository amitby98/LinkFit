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

// // Login
// router.post("/login", async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
//     res.json({ token, userId: user._id });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// Protected route example
// router.get("/protected", authMiddleware, (req: Request, res: Response) => {
//   res.json({ message: "This is a protected route", user: req.body.user });
// });
