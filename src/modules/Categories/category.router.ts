import express, { Application } from "express";
import { CategoryControllers } from "./category.controller";
import { auth_middleware } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.ADMIN]),
  CategoryControllers.createCategory,
);

router.get("/", CategoryControllers.getAllCategories);

router.patch(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  CategoryControllers.updateCategory,
);

router.delete(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  CategoryControllers.deleteCategory,
);

export const CategoryRouters = router;
