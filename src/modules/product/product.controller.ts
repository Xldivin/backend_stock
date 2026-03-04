import { Request, Response } from "express";
import { productService } from "./product.service";

export const productController = {
  create: async (req: Request, res: Response) => {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  },

  list: async (req: Request, res: Response) => {
    const result = await productService.list(req.query as unknown as Parameters<typeof productService.list>[0]);
    res.status(200).json(result);
  },
};
