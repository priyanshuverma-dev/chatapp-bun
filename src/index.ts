import { Hono } from "hono";
import { cors } from "hono/cors";
import { getUser, signIn, signUp } from "./users/index";
import { authMiddleware } from "./middleware/auth";
const app = new Hono();

app.use("/", cors());
app.use("/user/*", authMiddleware);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/auth/signup", signUp);
app.post("/auth/signin", signIn);

app.get("/user/me", getUser);

export default app;
