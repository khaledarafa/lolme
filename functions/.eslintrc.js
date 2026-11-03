
module.exports = {
  env: {
    es6: true,
    node: true,
  },

  parserOptions: {
    ecmaVersion: 2022,
  },

  extends: [
    "eslint:recommended",
    "google",
  ],

  rules: {
    // قواعد الأخطاء البرمجية
    "no-undef": "error",
    "no-unused-vars": ["warn", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
    }],

    // تعطيل قواعد التنسيق المزعجة
    "indent": "off",
    "operator-linebreak": "off",
    "max-len": "off",
    "comma-dangle": "off",
    "object-curly-spacing": "off",
    "array-bracket-spacing": "off",
    "function-paren-newline": "off",
    "object-curly-newline": "off",
    "implicit-arrow-linebreak": "off",
    "arrow-parens": "off",
    "eol-last": "off",

    // الاحتفاظ ببعض القواعد الأساسية
    "quotes": ["error", "double", {
      allowTemplateLiterals: true,
    }],

    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
  },

  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],

  globals: {},
};
