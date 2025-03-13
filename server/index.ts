import express, { Express, Request, Response } from "express";
import cors from "cors";
import connectDB from "./src/config/db.ts";
import { setupSwagger } from "./src/config/swagger.ts";
import { authRouter } from "./src/routes/auth.router";
import { userRouter } from "./src/routes/user.router";
import { postRouter } from "./src/routes/post.router";
import { exerciseRouter } from "./src/routes/exercises.router.ts";

//Load environment variables
require("dotenv").config();

/// Create Express server
const app: Express = express();

// Connect to database
connectDB();

// Express configuration
app.set("port", process.env.PORT || 3001);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// serve static files
app.use(express.static("uploads"));

app.get("/", (req: Request, res: Response) => {
  res.status(200).send({ message: "LinkFit API is running", status: "ok" });
});

// Make uploads directory accessible
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/exercises", exerciseRouter);

setupSwagger(app);
// Start Express server
app.listen(app.get("port"), () => {
  console.log("App is running at http://localhost:%d in %s mode", app.get("port"), app.get("env"));
  console.log("Press CTRL-C to stop\n");
});
