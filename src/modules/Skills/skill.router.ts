import express from "express";
import { SkillControllers } from "./skill.controller";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../generated/enums";
import {
  createSkillValidationSchema,
  updateSkillValidationSchema,
  deleteSkillValidationSchema,
} from "./skill.validation";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(createSkillValidationSchema),
  SkillControllers.createSkill,
);

router.get("/", SkillControllers.getAllSkills);

router.patch(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(updateSkillValidationSchema),
  SkillControllers.updateSkill,
);

router.delete(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(deleteSkillValidationSchema),
  SkillControllers.deleteSkill,
);

export const SkillRouters: express.Router = router;
