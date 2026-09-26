import { pathToFileURL } from "node:url";
import { prisma } from "../src/lib/prisma";

/**
 * Seed the Categories -> Subjects/Skills taxonomy.
 *
 * - Idempotent: safe to run on every (non-production) server start. It upserts
 *   by case-insensitive name, so re-runs never create duplicates.
 * - `reset: true` first wipes the existing taxonomy (dummy data) before seeding.
 *   This is destructive to tutor<->subject/skill links, so it is NOT used on
 *   startup — run it explicitly via `npm run seed:taxonomy:reset`.
 *
 * Does not touch auth data (User / Session / Account / Verification).
 */

type CategorySeed = {
  name: string;
  subjects?: string[];
  skills?: string[];
};

const TAXONOMY: CategorySeed[] = [
  {
    name: "Programming & Software Development",
    subjects: [
      "Data Structures",
      "Algorithms",
      "Object-Oriented Programming",
      "Database Management Systems",
      "Computer Networks",
      "Operating Systems",
      "Software Engineering",
      "Compiler Design",
      "Computer Architecture",
      "Theory of Computation",
      "Computer Graphics",
      "Web Development",
    ],
    skills: [
      "React",
      "Next.js",
      "Node.js",
      "Express.js",
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C++",
      "C Programming",
      "C#",
      "PHP",
      "Laravel",
      "SQL",
      "MongoDB",
      "PostgreSQL",
      "Git and GitHub",
      "REST API Design",
      "GraphQL",
      "System Design",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "Frontend Development",
      "Backend Development",
      "Full-Stack Development",
      "React Native",
      "Flutter",
      "Web Security",
      "Unit Testing",
      "Agile and Scrum",
    ],
  },
  {
    name: "Data Science & Artificial Intelligence",
    subjects: [
      "Machine Learning",
      "Deep Learning",
      "Artificial Intelligence",
      "Data Mining",
      "Computer Vision",
      "Natural Language Processing",
      "Big Data Analytics",
      "Pattern Recognition",
      "Reinforcement Learning",
    ],
    skills: [
      "Pandas",
      "NumPy",
      "scikit-learn",
      "TensorFlow",
      "PyTorch",
      "Tableau",
      "Data Visualization",
      "Data Analysis with Python",
      "Jupyter Notebook",
      "Prompt Engineering",
      "R Programming",
    ],
  },
  {
    name: "Electrical & Electronic Engineering",
    subjects: [
      "Circuit Analysis",
      "Digital Logic Design",
      "Signals and Systems",
      "Control Systems",
      "Power Systems",
      "Electromagnetic Fields",
      "Microprocessors and Microcontrollers",
      "Analog Electronics",
      "Communication Systems",
      "Electrical Machines",
      "Power Electronics",
      "VLSI Design",
      "Digital Signal Processing",
    ],
    skills: [
      "MATLAB and Simulink",
      "Proteus",
      "PCB Design",
      "Arduino",
      "Raspberry Pi",
      "Verilog and VHDL",
      "PLC Programming",
    ],
  },
  {
    name: "Civil Engineering",
    subjects: [
      "Structural Analysis",
      "Strength of Materials",
      "Concrete Technology",
      "Fluid Mechanics",
      "Soil Mechanics",
      "Transportation Engineering",
      "Surveying",
      "Geotechnical Engineering",
      "Environmental Engineering",
      "Construction Management",
      "Steel Structures",
      "Hydraulics",
    ],
    skills: [
      "STAAD Pro",
      "ETABS",
      "Quantity Surveying",
      "Primavera P6",
      "Autodesk Civil 3D",
    ],
  },
  {
    name: "Mechanical Engineering",
    subjects: [
      "Thermodynamics",
      "Heat Transfer",
      "Machine Design",
      "Theory of Machines",
      "Manufacturing Processes",
      "Engineering Mechanics",
      "Fluid Machinery",
      "Internal Combustion Engines",
      "Refrigeration and Air Conditioning",
      "Mechatronics",
    ],
    skills: ["SolidWorks", "CATIA", "ANSYS", "AutoCAD Mechanical"],
  },
  {
    name: "Industrial & Production Engineering",
    subjects: [
      "Operations Research",
      "Production Planning and Control",
      "Quality Management",
      "Industrial Management",
      "Supply Chain Management",
      "Work Study and Ergonomics",
      "Manufacturing Systems",
      "Maintenance Management",
    ],
    skills: [
      "Lean Six Sigma",
      "Project Management",
      "SAP ERP",
      "Inventory Management",
    ],
  },
  {
    name: "Mathematics",
    subjects: [
      "Calculus I",
      "Calculus II",
      "Calculus III",
      "Linear Algebra",
      "Differential Equations",
      "Discrete Mathematics",
      "Complex Analysis",
      "Numerical Methods",
      "Real Analysis",
      "Abstract Algebra",
      "Vector Analysis",
      "Probability and Statistics",
      "Ordinary Differential Equations",
      "Partial Differential Equations",
    ],
    skills: ["Olympiad Mathematics", "Mental Math"],
  },
  {
    name: "Physics",
    subjects: [
      "Classical Mechanics",
      "Electromagnetism",
      "Quantum Mechanics",
      "Thermodynamics and Statistical Mechanics",
      "Waves and Optics",
      "Modern Physics",
      "Solid State Physics",
      "Nuclear Physics",
      "Mathematical Physics",
    ],
  },
  {
    name: "Chemistry",
    subjects: [
      "Organic Chemistry",
      "Inorganic Chemistry",
      "Physical Chemistry",
      "Analytical Chemistry",
      "Polymer Chemistry",
      "Environmental Chemistry",
      "Industrial Chemistry",
    ],
  },
  {
    name: "Biology & Life Sciences",
    subjects: [
      "Cell Biology",
      "Genetics",
      "Microbiology",
      "Molecular Biology",
      "Biotechnology",
      "Immunology",
      "Botany",
      "Zoology",
      "Ecology",
      "Biochemistry",
    ],
  },
  {
    name: "Medical & Health Sciences",
    subjects: [
      "Human Anatomy",
      "Human Physiology",
      "Pharmacology",
      "Pathology",
      "Forensic Medicine",
      "Community Medicine",
      "Surgery",
      "Internal Medicine",
      "Pediatrics",
      "Obstetrics and Gynecology",
      "Public Health",
      "Nursing Fundamentals",
    ],
  },
  {
    name: "Business, Accounting & Finance",
    subjects: [
      "Financial Accounting",
      "Managerial Accounting",
      "Cost Accounting",
      "Auditing",
      "Taxation",
      "Corporate Finance",
      "Financial Management",
      "Investment Analysis",
      "Financial Markets",
      "Portfolio Management",
      "Risk Management",
      "Islamic Finance",
      "Financial Statement Analysis",
      "Business Law",
      "Entrepreneurship",
      "International Business",
      "Business Statistics",
    ],
    skills: [
      "Microsoft Excel",
      "Advanced Excel",
      "Tally ERP",
      "QuickBooks",
      "Financial Modeling",
      "Stock Market Basics",
      "Technical Analysis",
      "Personal Finance",
      "Business Analytics",
    ],
  },
  {
    name: "Economics & Development Studies",
    subjects: [
      "Microeconomics",
      "Macroeconomics",
      "Development Economics",
      "Econometrics",
      "International Economics",
      "Monetary Economics",
      "Public Finance",
      "Bangladesh Economy",
      "Economic History",
    ],
    skills: ["STATA", "EViews", "Economic Research Methods"],
  },
  {
    name: "Marketing & Digital Media",
    subjects: [
      "Marketing Principles",
      "Consumer Behavior",
      "Brand Management",
      "Digital Marketing Principles",
      "Advertising",
      "Public Relations",
    ],
    skills: [
      "Digital Marketing",
      "SEO",
      "Google Ads",
      "Facebook Ads",
      "Social Media Marketing",
      "Content Marketing",
      "Email Marketing",
      "Copywriting",
      "Video Marketing",
    ],
  },
  {
    name: "Language & Test Preparation",
    subjects: [
      "English Composition",
      "Academic Writing",
      "English Literature",
      "English Grammar",
      "Bangla Language",
    ],
    skills: [
      "IELTS Speaking",
      "IELTS Writing",
      "IELTS Reading",
      "IELTS Listening",
      "IELTS Full Preparation",
      "TOEFL Preparation",
      "Duolingo English Test",
      "Spoken English",
      "Business English",
      "Creative Writing",
      "Arabic Language",
      "French Language",
    ],
  },
  {
    name: "University & Admission Test Prep",
    skills: [
      "University Admission Test Preparation",
      "Engineering Admission Prep",
      "Medical Admission Prep",
      "BCS Preliminary Preparation",
      "Bank Job Preparation",
      "GRE Preparation",
      "GMAT Preparation",
      "SAT Preparation",
    ],
  },
  {
    name: "Design & Creative",
    subjects: ["Design Fundamentals", "Human-Computer Interaction"],
    skills: [
      "UI/UX Design",
      "Graphic Design",
      "Figma",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Canva",
      "Motion Graphics",
      "Video Editing",
      "Adobe Premiere Pro",
      "Adobe After Effects",
      "Blender 3D Modeling",
      "Logo Design",
      "Wireframing",
    ],
  },
  {
    name: "Career & Professional Development",
    skills: [
      "CV Writing",
      "Resume Review",
      "Job Interview Preparation",
      "LinkedIn Profile Optimization",
      "Cover Letter Writing",
      "Freelancing Basics",
      "Upwork Profile Setup",
      "Fiverr Profile Setup",
      "Client Communication",
      "Negotiation Skills",
      "Public Speaking",
      "Presentation Skills",
      "Personal Branding",
      "Time Management",
    ],
  },
  {
    name: "Architecture & Planning",
    subjects: [
      "Architectural Design",
      "Building Construction",
      "History of Architecture",
      "Urban Planning",
      "Landscape Architecture",
      "Building Materials",
      "Interior Design",
    ],
    skills: [
      "AutoCAD",
      "SketchUp",
      "Autodesk Revit",
      "3ds Max",
      "Lumion",
      "V-Ray",
    ],
  },
  {
    name: "Law & Governance",
    subjects: [
      "Constitutional Law",
      "Contract Law",
      "Criminal Law",
      "Company Law",
      "International Law",
      "Jurisprudence",
      "Legal Writing",
    ],
    skills: ["Legal Research", "Moot Court Preparation"],
  },
];

export async function seedTaxonomy({ reset = false }: { reset?: boolean } = {}) {
  console.log("🌱 Seeding taxonomy (Categories -> Subjects/Skills)...");

  if (reset) {
    console.log("⚠️  Resetting existing taxonomy...");
    await prisma.subject.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.categories.deleteMany();
  }

  const [existingCategories, existingSubjects, existingSkills] =
    await Promise.all([
      prisma.categories.findMany({
        select: { id: true, name: true, isActive: true },
      }),
      prisma.subject.findMany({
        select: { id: true, name: true, categoryId: true },
      }),
      prisma.skill.findMany({
        select: { id: true, name: true, categoryId: true },
      }),
    ]);

  const categoryByName = new Map(
    existingCategories.map((c) => [c.name.toLowerCase(), c]),
  );
  const subjectByName = new Map(
    existingSubjects.map((s) => [s.name.toLowerCase(), s]),
  );
  const skillByName = new Map(
    existingSkills.map((s) => [s.name.toLowerCase(), s]),
  );

  let categoriesCreated = 0;
  let subjectsCreated = 0;
  let skillsCreated = 0;

  for (const node of TAXONOMY) {
    const key = node.name.toLowerCase();
    let category = categoryByName.get(key);

    if (!category) {
      category = await prisma.categories.create({
        data: { name: node.name, isActive: true },
        select: { id: true, name: true, isActive: true },
      });
      categoryByName.set(key, category);
      categoriesCreated += 1;
    } else if (!category.isActive) {
      await prisma.categories.update({
        where: { id: category.id },
        data: { isActive: true },
      });
    }

    for (const name of node.subjects ?? []) {
      const subjectKey = name.toLowerCase();
      const existing = subjectByName.get(subjectKey);

      if (!existing) {
        const created = await prisma.subject.create({
          data: { name, categoryId: category.id, isActive: true },
          select: { id: true, name: true, categoryId: true },
        });
        subjectByName.set(subjectKey, created);
        subjectsCreated += 1;
      } else if (existing.categoryId !== category.id) {
        await prisma.subject.update({
          where: { id: existing.id },
          data: { categoryId: category.id },
        });
      }
    }

    for (const name of node.skills ?? []) {
      const skillKey = name.toLowerCase();
      const existing = skillByName.get(skillKey);

      if (!existing) {
        const created = await prisma.skill.create({
          data: { name, categoryId: category.id, isActive: true },
          select: { id: true, name: true, categoryId: true },
        });
        skillByName.set(skillKey, created);
        skillsCreated += 1;
      } else if (existing.categoryId !== category.id) {
        await prisma.skill.update({
          where: { id: existing.id },
          data: { categoryId: category.id },
        });
      }
    }
  }

  const totalSubjects = subjectByName.size;
  const totalSkills = skillByName.size;

  console.log(
    `✅ Taxonomy seeded (categories: +${categoriesCreated}, subjects: +${subjectsCreated}/${totalSubjects}, skills: +${skillsCreated}/${totalSkills})`,
  );

  return {
    categories: categoryByName.size,
    subjects: totalSubjects,
    skills: totalSkills,
  };
}

// Only run when executed directly (not imported by the server).
const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const reset = process.argv.includes("--reset");
  (async () => {
    await seedTaxonomy({ reset });
    process.exit(0);
  })().catch((error) => {
    console.error("❌ Taxonomy seeding failed:", error);
    process.exit(1);
  });
}
