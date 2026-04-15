import { TutorProfilesCreateInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";

const createProfile = async (tutorData: TutorProfilesCreateInput) => {
  return await prisma.tutorProfiles.create({
    data: tutorData,
  });
};

export const TutorProfileServices = {
  createProfile,
};
