import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../models/User.model";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthenticatedRequest extends Request {
  user: { id: string };
}

export const authMiddleware = (req: Request, res: Response, next: any): any => {
  const token = req.header("Authorization") ?? req.cookies.token;
  console.log(token);
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as AuthenticatedRequest).user = decoded as { id: string };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
