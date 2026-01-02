
import express from 'express';
import { createProduct, deleteProduct, getProductId, getProducts, updateProduct } from '../controllers/productController.js';
import { authMiddleware } from '../middleware/auth.js';

const productRouter = express.Router();

productRouter.get("/",getProducts);
productRouter.post("/", createProduct);
productRouter.get("/:productID", getProductId);
productRouter.post("/", authMiddleware, createProduct);
productRouter.put("/:productID", authMiddleware, updateProduct);
productRouter.delete("/:productID", authMiddleware, deleteProduct);





export default productRouter;
