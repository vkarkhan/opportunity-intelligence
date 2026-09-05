import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  agentRules: false,
  // Shared synthetic fixtures live one directory above the frontend package.
  turbopack: { root: path.resolve(__dirname, "..") },
};

export default config;
