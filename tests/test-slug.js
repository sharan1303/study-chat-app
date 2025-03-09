// Test script for module slug encoding/decoding with routing simulation

// Define our encoding/decoding functions
function encodeModuleSlug(moduleName) {
  if (!moduleName) return "";

  // Step 1: Convert to lowercase for consistency
  const lowerCaseName = moduleName.toLowerCase();

  // Step 2: Replace whitespaces, underscores, commas, dots, slashes with hyphens
  let cleanedName = lowerCaseName.replace(/[\s_,.\\/]+/g, "-");

  // Step 3: Replace other common punctuation with empty string
  cleanedName = cleanedName.replace(/[?*()+=:%&#;!~'"@]+/g, "");

  // Step 4: Clean up the result - normalize hyphens and trim
  cleanedName = cleanedName
    .replace(/-+/g, "-") // Replace multiple consecutive hyphens with a single hyphen
    .replace(/^-|-$/g, ""); // Remove leading and trailing hyphens

  return cleanedName;
}

function decodeModuleSlug(encodedSlug) {
  if (!encodedSlug) return "";

  // Step 1: Decode any URI components
  const decodedSlug = decodeURIComponent(encodedSlug);

  // Step 2: Replace hyphens with spaces for matching with database records
  return decodedSlug.replace(/-/g, " ");
}

// Simulate database lookup - returns true if module would be found
function simulateFindModule(decodedName, mockDatabaseName) {
  // Case-insensitive comparison (how Prisma would search)
  return decodedName.toLowerCase() === mockDatabaseName.toLowerCase();
}

// Test cases with actual module names as they would appear in database
const testCases = [
  { dbName: "Basic Module", url: "basic-module" },
  { dbName: "Module with_underscores", url: "module-with-underscores" },
  { dbName: "Module.with.dots", url: "module-with-dots" },
  { dbName: "Module/with/slashes", url: "module-with-slashes" },
  { dbName: "Module, with, commas", url: "module-with-commas" },
  { dbName: "Module?with*special(chars)+=%", url: "modulewithspecialchars" },
  {
    dbName: "Module-with-existing-hyphens",
    url: "module-with-existing-hyphens",
  },
  {
    dbName: "Español with accents and ümlaut",
    url: "español-with-accents-and-ümlaut",
  },
  { dbName: "Programming C++ & Java", url: "programming-c-java" },
  {
    dbName: "Finance: Investments & Returns (2023.Q4)",
    url: "finance-investments-returns-2023q4",
  },
];

// Run tests
console.log(
  "=== TESTING MODULE SLUG ENCODING/DECODING WITH ROUTING SIMULATION ===\n"
);

testCases.forEach((test) => {
  // Simulate encoding for URL generation
  const encodedFromDbName = encodeModuleSlug(test.dbName);

  // Simulate decoding from URL (server-side)
  const decodedFromUrl = decodeModuleSlug(test.url);

  // Check if database lookup would succeed
  const wouldBeFoundInDb = simulateFindModule(decodedFromUrl, test.dbName);

  console.log(`Database Name: '${test.dbName}'`);
  console.log(`Expected URL: '${test.url}'`);
  console.log(`Actual Encoded URL: '${encodedFromDbName}'`);
  console.log(`Decoded from URL: '${decodedFromUrl}'`);
  console.log(
    `URL matches DB format: ${encodedFromDbName === test.url ? "✓" : "✗"}`
  );
  console.log(`Would be found in DB: ${wouldBeFoundInDb ? "✓" : "✗"}\n`);
});
