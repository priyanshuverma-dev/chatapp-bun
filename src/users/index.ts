import { Context } from "hono";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import db from "../lib/db";
import { Request, Response } from "express";

export const getUser = async (req: Request, res: Response) => {
  const userId = req.headers["userId"] as string;
  console.log(`[INFO] User ID: ${userId}`);

  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
};

export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email, password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const userExists = await db.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hash(password, 10);

    const user = await db.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name,
      },
    });

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    console.log(`[ERROR] ${error}`);
    return res.status(400).json({ message: error.message });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email, password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const userExists = await db.user.findUnique({ where: { email } });
    if (!userExists) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordMatch = await compare(password, userExists.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const jwtToken = sign(
      {
        email: userExists.email,
        userId: userExists.id,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d", algorithm: "HS256" }
    );

    return res.json({ token: jwtToken });
  } catch (error: any) {
    console.log(`[ERROR] ${error}`);
    return res.status(400).json({ message: error.message });
  }
};
