import { Router } from "express";
import { TutorProfileControllers } from "./tutorProfile.controller";

const router = Router();

router.post("/", TutorProfileControllers.createProfile);

router.get("/", TutorProfileControllers.getAllProfiles);

router.get("/:id", TutorProfileControllers.getProfileById);

export const TutorProfileRouters: Router = router;
