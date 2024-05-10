import { Request, Response } from "express";
import { Context, Next } from "hono";

import { verify } from "jsonwebtoken";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: any
) => {
  // Check if the request has an Authorization header

  if (!req.header("Authorization")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    });

    req.headers["userId"] = (payload as any).userId as string;
    console.log(`[INFO] User payload: ${(payload as any).userId as string}`);
  } catch (error) {
    console.log(`[ERROR] ${error}`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  // If the Authorization header is valid, call the next middleware
  next();
};
