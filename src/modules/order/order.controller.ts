import { Request, Response } from "express";
import { getGuestUserId } from "../../lib/guest-user";
import { orderService } from "./order.service";

export const orderController = {
  list: async (req: Request, res: Response) => {
    const userId = await getGuestUserId(req);
    const result = await orderService.list({
      ...(req.query as unknown as Omit<Parameters<typeof orderService.list>[0], "userId">),
      userId,
    });
    res.status(200).json(result);
  },
};
