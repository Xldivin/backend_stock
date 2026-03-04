import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../lib/errors";
import { prisma } from "../lib/prisma";

type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  jwtVersion: number;
};

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing bearer token"));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, jwtVersion: true },
    });

    if (!user || user.jwtVersion !== payload.jwtVersion) {
      return next(new AppError(401, "UNAUTHORIZED", "Token is no longer valid"));
    }

    req.auth = {
      userId: payload.sub,
      email: payload.email,
      jwtVersion: payload.jwtVersion,
    };

    next();
  } catch {
    next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
};
