export default {
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "esnext",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  noExternal: ["@prisma/client"], 
  banner: {
    js: `import { createRequire } from "module";
         const require = createRequire(import.meta.url);`,
  },
};