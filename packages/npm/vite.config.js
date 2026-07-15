import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { copyFileSync, mkdirSync } from "node:fs";

function copyTypes() {
  return {
    name: "copy-types",
    closeBundle() {
      mkdirSync("dist", { recursive: true });
      copyFileSync("src/types/index.d.ts", "dist/index.d.ts");
      copyFileSync("src/types/react.d.ts", "dist/react.d.ts");
    }
  };
}

export default defineConfig({
  plugins: [react(), copyTypes()],
  build: {
    lib: {
      entry: {
        olloweditor: resolve(process.cwd(), "src/index.js"),
        "olloweditor-react": resolve(process.cwd(), "src/react/index.js")
      },
      name: "OllowEditor",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        if (format === "es") return `${entryName}.es.js`;
        return `${entryName}.cjs`;
      }
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM"
        },
        assetFileNames: "olloweditor.css"
      }
    }
  }
});
