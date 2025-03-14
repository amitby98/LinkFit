import "jest";
const request = require("supertest");
import UserModel from "../models/User.model";
import { app } from "./setup";

describe("Post API", () => {
  let token: string;
  const USER_EMAIL = "newuser@example.com";
  const USER_PASSWORD = "password123";
  const TEST_USERNAME = "testuser";
  const POST_CONTENT = "This is a test post";
  let POST_ID = "";
  let USER_ID = "";

  beforeAll(async () => {
    // Register and login a user to get the token
    await UserModel.deleteOne({ email: USER_EMAIL }).exec();
    await request(app).post("/api/auth/register").send({ email: USER_EMAIL, username: TEST_USERNAME, password: USER_PASSWORD });

    const response = await request(app).post("/api/auth/login").send({ email: USER_EMAIL, password: USER_PASSWORD });

    token = response.body.token;
    USER_ID = response.body.id;
  });

  it("should create a new post", async () => {
    const response = await request(app).post("/api/post").set("Authorization", `Bearer ${token}`).send({ body: POST_CONTENT });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Post created successfully");
    expect(response.body.id).toBeTruthy();
    POST_ID = response.body.id;
  });

  it("should get all posts", async () => {
    const response = await request(app).get("/api/post").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should like a post", async () => {
    const response = await request(app).post(`/api/post/${POST_ID}/like`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should edit a post", async () => {
    const response = await request(app).put(`/api/post/${POST_ID}`).set("Authorization", `Bearer ${token}`).send({ body: "Updated post content" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Post edited successfully");
  });

  it("should delete a post", async () => {
    const response = await request(app).delete(`/api/post/${POST_ID}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should get favorite posts", async () => {
    const response = await request(app).get("/api/post/favorites").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should get posts by a user", async () => {
    const response = await request(app).get(`/api/post/user/${USER_ID}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should add a comment to a post", async () => {
    const response = await request(app).post(`/api/post/${POST_ID}/comment`).set("Authorization", `Bearer ${token}`).send({ text: "This is a comment" });

    expect(response.status).toBe(200);
  });

  it("should return 401 for unauthorized access", async () => {
    const response = await request(app).get("/api/post").set("Authorization", `Bearer invalid-token`);

    expect(response.status).toBe(401);
  });
});
