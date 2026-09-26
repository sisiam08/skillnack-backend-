import express, { Application } from "express";
import { CategoryControllers } from "./category.controller";
import { auth_middleware } from "../../middleware/auth";
import { cachePublic } from "../../middleware/cacheControl";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../generated/enums";
import {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
  deleteCategoryValidationSchema,
} from "./category.validation";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

router.get("/", cachePublic(60), CategoryControllers.getAllCategories);

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
