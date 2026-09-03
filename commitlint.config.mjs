/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 描述允许中文等任意语言，不强制 subject 大小写
    "subject-case": [0],
  },
};

export default config;
