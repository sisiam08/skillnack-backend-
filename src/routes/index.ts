import { Router } from "express";
import { IRoute } from "../interfaces";
import { TutorProfileRouters } from "../modules/TutorProfiles/tutorProfile.router";
import { CategoryRouters } from "../modules/Categories/category.router";
import { BookingRouters } from "../modules/Bookings/booking.router";
import { UserRouters } from "../modules/Users/user.router";

const router = Router();

const routes: IRoute[] = [
  {
    path: "/tutors",
    route: TutorProfileRouters,
  },
  {
    path: "/categories",
    route: CategoryRouters,
  },
  {
    path: "/bookings",
    route: BookingRouters,
  },
  {
    path: "/users",
    route: UserRouters,
  }
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
