/**
 * This file is used to help with module resolution during development.
 * It forces TypeScript to recognize module relationships.
 */
console.log("Module resolution helper");

// List all modules explicitly to establish connections
require("./index");
require("./user");
require("./llm");
require("./auth");
require("./dto");
