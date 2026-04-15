import { Router } from "express";
import { TutorProfileControllers } from "./tutorProfile.controller";

const router = Router();

router.post("/", TutorProfileControllers.createProfile);

export const TutorProfileRouters: Router = router;
