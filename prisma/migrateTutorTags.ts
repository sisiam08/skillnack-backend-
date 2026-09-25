import { prisma } from "../src/lib/prisma";

/**
 * Best-effort migration of the legacy free-text `TutorProfiles.tags[]` values into
 * the new structured `Skill` taxonomy (see migration 20260925121000_subject_skill_taxonomy).
 *
 * Assumptions / ambiguity (documented, not silently dropped):
 * - Legacy `tags` were free-form expertise labels. We map every distinct tag to a
 *   `Skill`, because most seeded tags describe skills/topics rather than formal
 *   university Subjects. Ambiguous academic tags are therefore placed under Skills
 *   and can be re-classified by an admin later.
 * - Matching is case-insensitive on the trimmed name. The first occurrence's casing
 *   is used when creating a new Skill.
 * - Existing tag values are NOT modified or deleted; this is purely additive.
 * - This script is idempotent and is NOT run automatically by the seed. Run it
 *   explicitly with:  npm run migrate:tags
 */

const normalize = (value: string) => value.trim();

export async function migrateTutorTags() {
  const tutors = await prisma.tutorProfiles.findMany({
    select: { id: true, tags: true },
  });

  let createdSkills = 0;
  let linkedPairs = 0;
  const seen = new Map<string, string>();

  for (const tutor of tutors) {
    const tags = (tutor.tags ?? []).map(normalize).filter(Boolean);
    if (tags.length === 0) continue;

    const skillIds: string[] = [];

    for (const tag of tags) {
      const key = tag.toLowerCase();
      let skillId = seen.get(key);

      if (!skillId) {
        const existing = await prisma.skill.findFirst({
          where: { name: { equals: tag, mode: "insensitive" } },
          select: { id: true },
        });

        if (existing) {
          skillId = existing.id;
        } else {
          const created = await prisma.skill.create({
            data: { name: tag },
            select: { id: true },
          });
          skillId = created.id;
          createdSkills += 1;
        }

        seen.set(key, skillId);
      }

      skillIds.push(skillId);
    }

    if (skillIds.length > 0) {
      await prisma.tutorProfiles.update({
        where: { id: tutor.id },
        data: {
          skills: { connect: skillIds.map((id) => ({ id })) },
        },
      });
      linkedPairs += skillIds.length;
    }
  }

  return {
    tutorsScanned: tutors.length,
    createdSkills,
    linkedPairs,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const result = await migrateTutorTags();
    console.log("✅ Tag migration complete:", result);
    await prisma.$disconnect();
    process.exit(0);
  })().catch(async (error) => {
    console.error("❌ Tag migration failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
