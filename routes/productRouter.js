
import express from 'express';
import { createProduct, deleteProduct, getProductId, getProducts, updateProduct } from '../controllers/productController.js';
import { authMiddleware } from '../controllers/authMiddleware.js';

const productRouter = express.Router();

productRouter.get("/",getProducts)
productRouter.post("/", createProduct)
import { authMiddleware } from "../controllers/authMiddleware.js";

productRouter.post("/", authMiddleware, createProduct);
productRouter.put("/:productID", authMiddleware, updateProduct);
productRouter.delete("/:productID", authMiddleware, deleteProduct);





export default productRouter;
a
