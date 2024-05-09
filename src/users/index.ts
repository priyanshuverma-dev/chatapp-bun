import { Context } from "hono";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import db from "../lib/db";

export const getUser = async (c: Context) => {
  const userId = c.get("userId");
  console.log(`[INFO] User ID: ${userId}`);

  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json({
    name: user.name,
    email: user.email,
  });
};

export const signUp = async (c: Context) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ message: "Email, password are required" }, 400);
    }

    if (password.length < 6) {
      return c.json(
        { message: "Password must be at least 6 characters long" },
        400
      );
    }

    const userExists = await db.user.findUnique({ where: { email } });
    if (userExists) {
      return c.json({ message: "User already exists" }, 400);
    }

    const hashedPassword = await hash(password, 10);
    console.log(`[INFO] Hashed password: ${hashedPassword}`);
    console.log(`[INFO] User signed up with email: ${email}`);

    const user = await db.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name,
      },
    });

    return c.json({ message: "User signed up successfully" });
  } catch (error: any) {
    console.log(`[ERROR] ${error}`);
    return c.json({ message: error.message }, 400);
  }
};

export const signIn = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ message: "Email, password are required" }, 400);
    }

    if (password.length < 6) {
      return c.json(
        { message: "Password must be at least 6 characters long" },
        400
      );
    }

    const userExists = await db.user.findUnique({ where: { email } });
    if (!userExists) {
      return c.json({ message: "User with email does't exist" }, 400);
    }

    const isPasswordMatch = await compare(password, userExists.password);

    if (!isPasswordMatch) {
      return c.json({ message: "Invalid password" }, 400);
    }

    const jwtToken = sign(
      {
        email: userExists.email,
        userId: userExists.id,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d", algorithm: "HS256" }
    );

    return c.json({ message: "User signed in successfully", jwt: jwtToken });
  } catch (error: any) {
    console.log(`[ERROR] ${error}`);
    return c.json({ message: error.message }, 400);
  }
};
