import { Request, Response } from "express";
import { reservationService } from "./reservation.service";

export const reservationController = {
  reserve: async (req: Request, res: Response) => {
    const reservation = await reservationService.reserve(req.auth!.userId, req.body);
    res.status(201).json({
      reservationId: reservation.id,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
    });
  },

  checkout: async (req: Request, res: Response) => {
    const order = await reservationService.checkout(req.auth!.userId, req.body);
    res.status(201).json(order);
  },

  list: async (req: Request, res: Response) => {
    const result = await reservationService.list({
      ...(req.query as unknown as Omit<Parameters<typeof reservationService.list>[0], "userId">),
      userId: req.auth!.userId,
    });
    res.status(200).json(result);
  },
};
