import axios from "axios";
import express, { Request, Response } from "express";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: "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", // process.env.OPENAI_API_KEY,
});

async function getChatResponse(userMessage: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful and concise AI assistant. Always provide clear and accurate answers. You would receive request for exercise guidance according to an exercise name and a question. Limit your response to 5 bullet points.",
      },
      { role: "user", content: userMessage },
    ],
  });

  console.log(response);
  console.log(response.choices[0].message);

  return response.choices[0].message.content;
}

export const getExerciseRecommendations = async (req: Request, res: Response) => {
  const exercise = req.body.exercise;
  const prompt = req.body.prompt;
  const response = await getChatResponse(`Exercise name: "${exercise}. Question: ${prompt}`);
  res.json({ response });
};

export const getExercisesForMuscle = async (req: Request, res: Response) => {
  const API_URL = "https://exercisedb.p.rapidapi.com/exercises/bodyPart";
  const API_KEY = process.env.EXERCISEDB_API_KEY as string;
  const muscle = req.params.muscle;

  try {
    const response = await axios.get(`${API_URL}/${muscle}`, {
      headers: {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ error: "Error receiving training" });
  }
};
