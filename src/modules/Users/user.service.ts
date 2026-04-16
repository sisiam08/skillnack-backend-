import { prisma } from "../../lib/prisma";

const updateMe = async (
  userId: string,
  data: { name?: string; phone?: string; image?: string },
) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
  });
};

export const UserServices = {
  updateMe,
};
