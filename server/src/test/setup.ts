import { IncomingMessage, Server, ServerResponse } from "http";
import { appPromise } from "..";
import { Express } from "express";
let app: Express;
let server: Server<typeof IncomingMessage, typeof ServerResponse>;
beforeAll(async () => {
  const result = await appPromise;
  app = result[0];
  server = result[1];
});

afterAll(async () => {
  // kill the server

  await new Promise<void>(resolve => {
    server.close();
    setTimeout(() => {
      resolve();
    }, 1000);
  });
});

export { app };
