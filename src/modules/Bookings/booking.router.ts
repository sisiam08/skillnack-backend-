import express from "express";
import { auth_middleware } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { BookingControllers } from "./booking.controller";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.STUDENT]),
  BookingControllers.createBooking,
);

export const BookingRouters = router;
