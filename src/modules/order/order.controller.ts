import { Request, Response } from "express";
import { orderService } from "./order.service";

export const orderController = {
  list: async (req: Request, res: Response) => {
    const result = await orderService.list({
      ...(req.query as unknown as Omit<Parameters<typeof orderService.list>[0], "userId">),
      userId: req.auth!.userId,
    });
    res.status(200).json(result);
  },
};
