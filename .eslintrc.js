module.exports = {
  extends: [
    "plugin:ferns/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  overrides: [
    {
      files: ["**/*.test.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "dayjs",
                message: "dayjs is not allowed in test files. Use luxon instead."
              }
            ]
          }
        ]
      }
    }
  ]
};

