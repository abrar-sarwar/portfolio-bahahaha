import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        home: "#290000",
        projects: "#022C39",
        progsu: "#26013D",
        cyber: "#020059",
      },
    },
  },
  plugins: [],
};

export default config;
