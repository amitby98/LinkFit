import express, { Request, Response } from "express";
import { getExerciseRecommendations, getExercisesForMuscle } from "../controllers/exercises.controller";

export const exerciseRouter = express.Router();

exerciseRouter.post("/guidance", getExerciseRecommendations);

exerciseRouter.get("/:muscle", getExercisesForMuscle);
