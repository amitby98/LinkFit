import { before } from "node:test";
import { appPromise } from "../index";
import UserModel from "../models/User.model";
import "jest";
import { app } from "./setup";
const request = require("supertest");

describe("Authentication API", () => {
  let token: string;
  const USER_EMAIL = "newuser@example.com";
  const USER_PASSWORD = "password123";
  const TEST_USERNAME = "testuser";

  beforeAll(async () => {
    await UserModel.deleteOne({ email: USER_EMAIL }).exec();
  });

  it("should register a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: USER_EMAIL, username: TEST_USERNAME, password: USER_PASSWORD });

    expect(response.status).toBe(201);
  });

  it("should not register an existing user", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: USER_EMAIL, username: "existinguser", password: "password123" });

    expect(response.status).toBe(400);
  });

  it("should log in a user", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: USER_EMAIL, password: USER_PASSWORD });

    token = response.body.token;
    expect(response.status).toBe(200);
  });

  it("should not log in with invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: USER_EMAIL, password: "wrongpassword" });

    expect(response.status).toBe(401);
  });

  it("should log in with Google", async () => {
    const response = await request(app).post("/api/auth/login-with-google").send({ email: "googleuser@example.com", username: "googleuser" });

    expect(response.status).toBe(201);
  });

  it("should retrieve authenticated user profile", async () => {
    const response = await request(app).get("/api/auth/check").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: USER_EMAIL,
      username: "testuser",
    });
  });

  it("should return 401 for unauthorized user profile access", async () => {
    const response = await request(app).get("/api/auth/check");
    expect(response.status).toBe(401);
  });
});
