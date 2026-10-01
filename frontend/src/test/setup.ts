import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { parse } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.example");
Object.assign(process.env, parse(readFileSync(envPath)));

if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = "/api";
}

expect.extend(matchers);
