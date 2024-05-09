import { Context, Next } from "hono";

import { verify } from "jsonwebtoken";

export const authMiddleware = async (c: Context, next: Next) => {
  // Check if the request has an Authorization header

  if (!c.req.header("Authorization")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    });

    c.set("userId", (payload as any).userId as string);

    console.log(`[INFO] User payload: ${(payload as any).userId as string}`);
  } catch (error) {
    console.log(`[ERROR] ${error}`);
    return c.json({ error: "Unauthorized" }, 401);
  }

  // If the Authorization header is valid, call the next middleware
  return next();
};
