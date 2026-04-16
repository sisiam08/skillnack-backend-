import { Request, Response } from "express";
import { UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { name, phone } = req.body;
  const file = req.file as Express.Multer.File;

  // Prepare update data
  const updateData: { name?: string; phone?: string; image?: string } = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  // Extract Cloudinary URL directly from multer (already uploaded by middleware)
  if (file) {
    updateData.image = (file as any).path || (file as any).url;
  }

  const data = await UserServices.updateMe(userId, updateData);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data,
  });
});

export const UserControllers = {
  updateMe,
};
