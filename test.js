// Test suite for Chomptron AI Recipe Generator
console.log("Running Chomptron tests...\n");

const fs = require("fs");
const http = require("http");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    failed++;
  }
}

// Static file tests
console.log("File Structure Tests:");
assert(fs.existsSync("./server.js"), "server.js exists");
assert(fs.existsSync("./index.html"), "index.html exists");
assert(fs.existsSync("./Dockerfile"), "Dockerfile exists");
assert(fs.existsSync("./cloudbuild.yaml"), "cloudbuild.yaml exists");

// Package dependencies test
console.log("\nDependency Tests:");
const pkg = require("./package.json");
assert(pkg.dependencies.express, "express dependency exists");
assert(
  pkg.dependencies["@google/generative-ai"],
  "Gemini AI dependency exists",
);
assert(pkg.name === "chomptron", "package name is chomptron");
assert(
  pkg.description.includes("recipe"),
  "package description mentions recipes",
);

// Dockerfile validation
console.log("\nDocker Configuration Tests:");
const dockerfile = fs.readFileSync("./Dockerfile", "utf8");
assert(dockerfile.includes("FROM node"), "Dockerfile uses Node base image");
assert(dockerfile.includes("npm"), "Dockerfile installs dependencies");
assert(dockerfile.includes("EXPOSE 8080"), "Dockerfile exposes port 8080");

// Cloud Build configuration
console.log("\nCloud Build Tests:");
const cloudbuild = fs.readFileSync("./cloudbuild.yaml", "utf8");
assert(cloudbuild.includes("docker"), "cloudbuild.yaml has docker build step");
assert(cloudbuild.includes("push"), "cloudbuild.yaml has docker push step");
assert(
  cloudbuild.includes("chomptron"),
  "cloudbuild.yaml references chomptron",
);

// Server code validation
console.log("\nServer Code Tests:");
const serverCode = fs.readFileSync("./server.js", "utf8");
assert(
  serverCode.includes("/api/generate-recipe"),
  "server has recipe generation endpoint",
);
assert(serverCode.includes("/health"), "server has health check endpoint");
assert(serverCode.includes("/ready"), "server has readiness check endpoint");
assert(serverCode.includes("GoogleGenerativeAI"), "server uses Gemini AI");

// HTML content validation
console.log("\nFrontend Tests:");
const html = fs.readFileSync("./index.html", "utf8");
const css = fs.existsSync("./styles.css") ? fs.readFileSync("./styles.css", "utf8") : "";
const js = fs.existsSync("./app.js") ? fs.readFileSync("./app.js", "utf8") : "";

assert(html.includes("Chomptron"), "HTML includes Chomptron branding");
assert(html.includes("recipe"), "HTML mentions recipes");
assert(
  html.includes("styles.css") || css.length > 0,
  "HTML links to styles.css or CSS is present",
);
assert(
  html.includes("app.js") || js.length > 0,
  "HTML links to app.js or JS is present",
);
assert(
  html.includes("/api/generate-recipe") || js.includes("/api/generate-recipe"),
  "App calls recipe API",
);
assert(html.includes("ingredients"), "HTML has ingredients input");

// Recipe History & Favorites feature tests
console.log("\nRecipe History & Favorites Tests:");
assert(
  html.includes("RecipeManager") || js.includes("RecipeManager"),
  "App includes RecipeManager object",
);
assert(
  html.includes("chomptron_recipes") || js.includes("chomptron_recipes"),
  "App defines recipe storage key",
);
assert(
  html.includes("getRecipes") || js.includes("getRecipes"),
  "App has getRecipes function",
);
assert(
  html.includes("saveRecipe") || js.includes("saveRecipe"),
  "App has saveRecipe function",
);
assert(
  html.includes("toggleFavorite") || js.includes("toggleFavorite"),
  "App has toggleFavorite function",
);
assert(
  html.includes("exportToJSON") || js.includes("exportToJSON"),
  "App has exportToJSON function",
);
assert(
  html.includes("exportToText") || js.includes("exportToText"),
  "App has exportToText function",
);
assert(
  html.includes("clearAll") || js.includes("clearAll"),
  "App has clearAll function",
);
assert(
  html.includes("extractRecipeName") || js.includes("extractRecipeName"),
  "App has recipe name extraction",
);
assert(
  html.includes("renderHistory") || js.includes("renderHistory"),
  "App has renderHistory function",
);
assert(
  html.includes("filterHistory") || js.includes("filterHistory"),
  "App has filterHistory function",
);
assert(
  html.includes("showFavorites") || js.includes("showFavorites"),
  "App has showFavorites function",
);
assert(
  html.includes("showAllHistory") || js.includes("showAllHistory"),
  "App has showAllHistory function",
);
assert(
  html.includes("loadRecipe") || js.includes("loadRecipe"),
  "App has loadRecipe function",
);
assert(
  html.includes("updateFavoriteButton") || js.includes("updateFavoriteButton"),
  "App has updateFavoriteButton function",
);

// UI Component tests
console.log("\nHistory UI Component Tests:");
assert(
  html.includes('class="history-toggle"'),
  "HTML has history toggle button",
);
assert(
  html.includes('id="historyPanel"'),
  "HTML has history panel element",
);
assert(
  html.includes('id="historySearch"'),
  "HTML has history search input",
);
assert(html.includes('id="historyList"'), "HTML has history list container");
assert(
  html.includes('id="favoriteBtn"'),
  "HTML has favorite toggle button",
);
assert(
  html.includes("toggleHistory") || js.includes("toggleHistory"),
  "App has toggleHistory function",
);
assert(
  html.includes("exportJSON") || js.includes("exportJSON"),
  "App has exportJSON function",
);
assert(
  html.includes("clearHistory") || js.includes("clearHistory"),
  "App has clearHistory function",
);

// CSS styling tests
console.log("\nHistory Styling Tests:");
assert(
  html.includes(".history-toggle") || css.includes(".history-toggle"),
  "App has history toggle button styles",
);
assert(
  html.includes(".history-panel") || css.includes(".history-panel"),
  "App has history panel styles",
);
assert(
  html.includes(".recipe-item") || css.includes(".recipe-item"),
  "App has recipe item styles",
);
assert(
  html.includes(".favorite-btn") || css.includes(".favorite-btn"),
  "App has favorite button styles",
);
assert(
  html.includes(".empty-history") || css.includes(".empty-history"),
  "App has empty state styles",
);
assert(
  html.includes(".history-panel.open") || css.includes(".history-panel.open"),
  "App has open panel state styles",
);
assert(
  html.includes(".favorite-toggle-btn") || css.includes(".favorite-toggle-btn"),
  "App has favorite toggle styles",
);

// Mobile responsive tests
console.log("\nMobile Responsive Tests:");
assert(
  html.includes("@media (max-width: 768px)") ||
  css.includes("@media (max-width: 768px)"),
  "App has tablet breakpoint",
);
assert(
  html.includes("@media (max-width: 600px)") ||
  css.includes("@media (max-width: 600px)"),
  "App has mobile breakpoint",
);

// localStorage integration tests
console.log("\nLocalStorage Integration Tests:");
assert(
  html.includes("localStorage.getItem") || js.includes("localStorage.getItem"),
  "App uses localStorage.getItem",
);
assert(
  html.includes("localStorage.setItem") || js.includes("localStorage.setItem"),
  "App uses localStorage.setItem",
);
assert(
  html.includes("localStorage.removeItem") ||
  js.includes("localStorage.removeItem"),
  "App uses localStorage.removeItem",
);
assert(
  html.includes("JSON.parse") || js.includes("JSON.parse"),
  "App parses stored JSON",
);
assert(
  html.includes("JSON.stringify") || js.includes("JSON.stringify"),
  "App stringifies data for storage",
);

// Recipe save integration
console.log("\nRecipe Save Integration Tests:");
assert(
  (html.includes("RecipeManager.saveRecipe") ||
    js.includes("RecipeManager.saveRecipe")) &&
  (html.includes("ingredients") || js.includes("ingredients")) &&
  (html.includes("data.recipe") || js.includes("data.recipe")),
  "App auto-saves recipes on generation",
);
assert(
  html.includes("RecipeManager.currentRecipeId") ||
  js.includes("RecipeManager.currentRecipeId"),
  "App tracks current recipe ID",
);
assert(
  html.match(/if\s*\(\s*recipes\.length\s*>\s*100\s*\)/) ||
  js.match(/if\s*\(\s*recipes\.length\s*>\s*100\s*\)/),
  "App limits history to 100 recipes",
);

// Node.js version check
console.log("\nEnvironment Tests:");
const nodeVersion = parseInt(process.version.slice(1).split(".")[0]);
assert(
  nodeVersion >= 18,
  `Node.js version >= 18 (current: ${process.version})`,
);

// Health check endpoint test
console.log("\nHealth Check Tests:");
const server = require("./server.js");
const port = 8080;

setTimeout(() => {
  const options = {
    hostname: "localhost",
    port: port,
    path: "/health",
    method: "GET",
  };

  const healthReq = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        assert(res.statusCode === 200, "/health endpoint returns 200");
        assert(
          json.status === "healthy",
          "/health endpoint returns healthy status",
        );
        assert(
          json.service === "chomptron",
          "/health endpoint identifies as chomptron",
        );
      } catch {
        assert(false, "/health endpoint returns valid JSON");
      }

      // Test readiness endpoint
      const readyOptions = { ...options, path: "/ready" };
      const readyReq = http.request(readyOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            assert(
              [200, 503].includes(res.statusCode),
              "/ready endpoint returns 200 or 503",
            );
            assert(json.status !== undefined, "/ready endpoint returns status");
          } catch {
            assert(false, "/ready endpoint returns valid JSON");
          }

          // Summary
          console.log(`\n${"=".repeat(50)}`);
          console.log(`✓ ${passed} passed | ✗ ${failed} failed`);
          console.log(`${"=".repeat(50)}`);

          server.close();

          if (failed > 0) {
            process.exit(1);
          }
          console.log("\n✓ All Chomptron tests passed!");
        });
      });

      readyReq.on("error", () => {
        assert(false, "/ready endpoint is accessible");
        server.close();
        process.exit(1);
      });

      readyReq.end();
    });
  });

  healthReq.on("error", () => {
    assert(false, "/health endpoint is accessible");
    server.close();
    process.exit(1);
  });

  healthReq.end();
}, 1000);
