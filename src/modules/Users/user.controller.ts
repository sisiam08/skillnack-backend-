import { Request, Response } from "express";
import { UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { name, phone, image } = req.body;

  const data = await UserServices.updateMe(userId, { name, phone, image });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data,
  });
});

export const UserControllers = {
  updateMe,
};
