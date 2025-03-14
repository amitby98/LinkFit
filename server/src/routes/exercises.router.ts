import express, { Request, Response } from "express";
import { getExerciseRecommendations, getExercisesForMuscle } from "../controllers/exercises.controller";

//swagger docs
/**
 * @swagger
 * tags:
 *   name: Exercises
 *  description: API endpoints for managing exercises
 */
export const exerciseRouter = express.Router();

//swagger post
/**
 * @swagger
 * /api/exercises/guidance:
 *   post:
 *     summary: Get exercise recommendations
 *     tags: [Exercises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exercise:
 *                 type: string
 *                 description: The exercise name
 *               prompt:
 *                 type: string
 *                 description: The user's prompt
 *     responses:
 *       200:
 *         description: Exercise recommendations returned
 *       400:
 *         description: Error getting exercise recommendations
 */
exerciseRouter.post("/guidance", getExerciseRecommendations);

/**
 * @swagger
 * /exercises/{muscle}:
 *   get:
 *     summary: Get exercises for a specific muscle group
 *     description: Returns a list of exercises targeting the specified muscle.
 *     tags:
 *       - Exercises
 *     parameters:
 *       - in: path
 *         name: muscle
 *         required: true
 *         schema:
 *           type: string
 *         example: "chest"
 *     responses:
 *       200:
 *         description: Successful response with a list of exercises.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *       400:
 *         description: Bad request, invalid muscle group.
 *       500:
 *         description: Internal server error.
 */
exerciseRouter.get("/:muscle", getExercisesForMuscle);
