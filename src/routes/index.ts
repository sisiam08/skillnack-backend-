import { Router } from "express";
import { IRoute } from "../interfaces";
import { TutorProfileRouters } from "../modules/TutorProfiles/tutorProfile.router";
import { CategoryRouters } from "../modules/Categories/category.router";
import { SubjectRouters } from "../modules/Subjects/subject.router";
import { SkillRouters } from "../modules/Skills/skill.router";
import { BookingRouters } from "../modules/Bookings/booking.router";
import { UserRouters } from "../modules/Users/user.router";
import { AdminRouters } from "../modules/Admin/admin.router";
import { StudentRouter } from "../modules/Students/student.router";
import { ReviewRouters } from "../modules/Reviews/review.router";
import { UploadRouters } from "../modules/Uploads/upload.router";

const router = Router();

const routes: IRoute[] = [
  {
    path: "/admin",
    route: AdminRouters,
  },
  {
    path: "/users",
    route: UserRouters,
  },
  {
    path: "/students",
    route: StudentRouter,
  },
  {
    path: "/tutors",
    route: TutorProfileRouters,
  },
  {
    path: "/categories",
    route: CategoryRouters,
  },
  {
    path: "/subjects",
    route: SubjectRouters,
  },
  {
    path: "/skills",
    route: SkillRouters,
  },
  {
    path: "/bookings",
    route: BookingRouters,
  },
  {
    path: "/reviews",
    route: ReviewRouters,
  },
  {
    path: "/uploads",
    route: UploadRouters,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
