import { Router } from "express";
import { TutorProfileControllers } from "./tutorProfile.controller";

const router = Router();

router.post("/", TutorProfileControllers.createProfile);

router.get("/", TutorProfileControllers.getAllProfiles);

export const TutorProfileRouters: Router = router;
