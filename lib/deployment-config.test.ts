import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("deployment configuration", () => {
  it("excludes source PDFs and screenshots from Vercel deployments", () => {
    const vercelIgnore = readFileSync(resolve(process.cwd(), ".vercelignore"), "utf8");

    expect(vercelIgnore).toContain("*.pdf");
    expect(vercelIgnore).toContain("artifacts/");
  });
});
