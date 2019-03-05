module.exports = {
  testRegex: "(/__tests__/.*|(\\.|/|-)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: ["ts", "js"],
  testPathIgnorePatterns: [
    "node_modules",
    "<rootDir>/docs",
    "build",
    "src",
    "bin"
  ]
};
