import { Subject } from "../../generated/client";
import { prisma } from "../../lib/prisma";

const createSubject = async (
  subjectData: Omit<Subject, "id" | "createdAt" | "updatedAt">,
) => {
  return await prisma.subject.create({
    data: subjectData,
  });
};

const getAllSubjects = async (includeInactive = false) => {
  return await prisma.subject.findMany({
    orderBy: { name: "asc" },
    where: includeInactive ? {} : { isActive: true },
    include: { category: { select: { id: true, name: true } } },
  });
};

const updateSubject = async (
  id: string,
  subjectData: Partial<Omit<Subject, "id" | "createdAt" | "updatedAt">>,
) => {
  return await prisma.subject.update({
    where: { id },
    data: subjectData,
  });
};

const deleteSubject = async (id: string) => {
  return await prisma.subject.delete({
    where: { id },
  });
};

export const SubjectServices = {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
};
