import { Request, Response } from "express";
import { getPublicUserId } from "../../lib/public-user";
import { reservationService } from "./reservation.service";

export const reservationController = {
  reserve: async (req: Request, res: Response) => {
    const userId = await getPublicUserId();
    const reservation = await reservationService.reserve(userId, req.body);
    res.status(201).json({
      reservationId: reservation.id,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
    });
  },

  checkout: async (req: Request, res: Response) => {
    const userId = await getPublicUserId();
    const order = await reservationService.checkout(userId, req.body);
    res.status(201).json(order);
  },

  list: async (req: Request, res: Response) => {
    const userId = await getPublicUserId();
    const result = await reservationService.list({
      ...(req.query as unknown as Omit<Parameters<typeof reservationService.list>[0], "userId">),
      userId,
    });
    res.status(200).json(result);
  },
};
