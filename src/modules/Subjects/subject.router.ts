import express from "express";
import { SubjectControllers } from "./subject.controller";
import { auth_middleware } from "../../middleware/auth";
import { cachePublic } from "../../middleware/cacheControl";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../generated/enums";
import {
  createSubjectValidationSchema,
  updateSubjectValidationSchema,
  deleteSubjectValidationSchema,
} from "./subject.validation";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(createSubjectValidationSchema),
  SubjectControllers.createSubject,
);

router.get("/", cachePublic(60), SubjectControllers.getAllSubjects);

router.patch(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(updateSubjectValidationSchema),
  SubjectControllers.updateSubject,
);

router.delete(
  "/:id",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(deleteSubjectValidationSchema),
  SubjectControllers.deleteSubject,
);

export const SubjectRouters: express.Router = router;
