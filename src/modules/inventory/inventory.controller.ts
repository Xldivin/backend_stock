import { Request, Response } from "express";
import { inventoryService } from "./inventory.service";

export const inventoryController = {
  list: async (req: Request, res: Response) => {
    const result = await inventoryService.list(req.query as unknown as Parameters<typeof inventoryService.list>[0]);
    res.status(200).json(result);
  },
};
