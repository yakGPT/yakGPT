module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
  },
  // https://github.com/i18next/next-i18next/issues/1552#issuecomment-981156476
  localePath:
    typeof window === "undefined"
      ? require("path").resolve("./public/locales")
      : "/public/locales",
};
