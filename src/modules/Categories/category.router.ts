import express, { Application } from "express";
import { CategoryControllers } from "./category.controller";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../../generated/prisma/enums";
import {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
  deleteCategoryValidationSchema,
  getAllCategoriesValidationSchema,
} from "./category.validation";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

router.get(
  "/",
  validateRequest(getAllCategoriesValidationSchema),
  CategoryControllers.getAllCategories,
);

router.patch(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);

router.delete(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(deleteCategoryValidationSchema),
  CategoryControllers.deleteCategory,
);

export const CategoryRouters = router;
