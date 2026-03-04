import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";

type AuthInput = {
  email: string;
  password: string;
};

export const authService = {
  register: async (input: AuthInput & { name: string }) => {
    const passwordHash = await bcrypt.hash(input.password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash,
        },
      });

      return authService.buildAuthResponse(user.id, user.email, user.name, user.jwtVersion);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "EMAIL_EXISTS", "A user with this email already exists");
      }
      throw error;
    }
  },

  login: async (input: AuthInput) => {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    return authService.buildAuthResponse(user.id, user.email, user.name, user.jwtVersion);
  },

  buildAuthResponse: (userId: string, email: string, name: string, jwtVersion: number) => {
    const token = jwt.sign({ sub: userId, email, jwtVersion }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });

    return {
      token,
      user: {
        id: userId,
        email,
        name,
      },
    };
  },
};
