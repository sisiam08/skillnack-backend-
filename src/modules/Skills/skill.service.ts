import { Skill } from "../../generated/client";
import { prisma } from "../../lib/prisma";

const createSkill = async (
  skillData: Omit<Skill, "id" | "createdAt" | "updatedAt">,
) => {
  return await prisma.skill.create({
    data: skillData,
  });
};

const getAllSkills = async (includeInactive = false) => {
  return await prisma.skill.findMany({
    orderBy: { name: "asc" },
    where: includeInactive ? {} : { isActive: true },
    include: { category: { select: { id: true, name: true } } },
  });
};

const updateSkill = async (
  id: string,
  skillData: Partial<Omit<Skill, "id" | "createdAt" | "updatedAt">>,
) => {
  return await prisma.skill.update({
    where: { id },
    data: skillData,
  });
};

const deleteSkill = async (id: string) => {
  return await prisma.skill.delete({
    where: { id },
  });
};

export const SkillServices = {
  createSkill,
  getAllSkills,
  updateSkill,
  deleteSkill,
};
