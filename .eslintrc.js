module.exports = {
  parser: "babel-eslint",
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
  globals: {
    jsdom: "readonly",
    strapi: true,
  },
  plugins: ["jest", "jsx-a11y", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:prettier/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "react/jsx-uses-react": 0,
    "react/no-children-prop": 0,
    "react/prop-types": 0,
    "react/react-in-jsx-scope": 0,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
      ],
      rules: {
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
