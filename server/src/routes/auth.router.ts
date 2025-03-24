import express from "express";
import dotenv from "dotenv";
import { login, loginWithGoogle, register } from "../controllers/auth.controller";
import { getUserProfile } from "../controllers/user.controller";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";

dotenv.config();

export const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication routes
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
authRouter.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Please provide email and password
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: Invalid email
 *       500:
 *         description: Server error
 */
authRouter.post("/login", login);

/**
 * @swagger
 * /api/auth/login-with-google:
 *   post:
 *     summary: Log in or register with Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: User logged in or registered successfully
 *       500:
 *         description: Server error
 */
authRouter.post("/login-with-google", loginWithGoogle);

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User's email
 *                 username:
 *                   type: string
 *                   description: User's username
 *       401:
 *         description: Unauthorized, invalid or missing token
 */

authRouter.get("/check", authMiddleware, (req, res) => getUserProfile(req as AuthenticatedRequest, res));
