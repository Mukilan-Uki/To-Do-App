module.exports = {
  preset: "react-native",
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-native-async-storage)/)",
  ],
};
