import express, { Express, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import { setupSwagger } from "./config/swagger";
import { authRouter } from "./routes/auth.router";
import { userRouter } from "./routes/user.router";
import { postRouter } from "./routes/post.router";
import { exerciseRouter } from "./routes/exercises.router";
import { commentRouter } from "./routes/comment.router";
import { IncomingMessage, Server, ServerResponse } from "http";
import path from "path";
import fs from "fs";
import https from "https";

//Load environment variables
require("dotenv").config();

export const appPromise = new Promise<[Express, Server<typeof IncomingMessage, typeof ServerResponse>]>(resolve => {
  return connectDB().then(() => {
    const app: Express = express();

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
    app.use(express.static("client-dist"));

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
    app.use("/api/comment", commentRouter);

    setupSwagger(app);
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "client-dist", "index.html"));
    });

    // Start Express server
    const isProd = process.env.NODE_ENV === "production";
    console.log(`Mode: ${process.env.NODE_ENV}`);
    let port;
    if (!isProd) {
      port = process.env.PORT;
      const server = app.listen(port, () => {
        console.log("Press CTRL-C to stop\n");
        resolve([app, server]);
      });
      console.log("App is running at http://localhost:%d in %s mode", port, process.env.NODE_ENV);
    } else {
      port = process.env.HTTPS_PORT;

      const options = {
        key: fs.readFileSync("./client-key.pem"),
        cert: fs.readFileSync("./client-cert.pem"),
      };
      https.createServer(options, app).listen(port);
      console.log("App is running at http://localhost:%d in %s mode", port, process.env.NODE_ENV);
    }
  });
});
