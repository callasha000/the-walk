/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.resolve(repoRoot, process.argv[2] ?? "module-zones.csv");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(repoRoot, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypescript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });

  module._compile(outputText, filename);
};

const { modules } = require(path.join(repoRoot, "data", "modules.ts"));

const moduleHeightsByLevel = new Map([
  [1, `10' - 11 7/8"`],
  [2, `10' - 11 7/8"`],
  [3, `10' - 11 7/8"`],
  [4, `10' - 11 7/8"`],
  [5, `10' - 11 7/8"`],
  [6, `10' - 11 7/8"`],
  [7, `10' - 1 1/8"`],
]);

function moduleNumber(moduleId) {
  return Number(moduleId.replace(/^M/, ""));
}

function escapeCsv(value) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function heightForModule(module) {
  return moduleHeightsByLevel.get(module.level) ?? "";
}

const sortedModules = [...modules].sort(
  (left, right) => moduleNumber(left.id) - moduleNumber(right.id),
);

const rows = [
  ["Module", "Zone", "Height", "Width", "Length", "Image"],
  ...sortedModules.map((module) => [
    module.id,
    module.buildingZone,
    heightForModule(module),
    "",
    "",
    "",
  ]),
];

fs.writeFileSync(
  outputPath,
  `${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`,
);

console.log(`Wrote ${sortedModules.length} modules to ${outputPath}`);
