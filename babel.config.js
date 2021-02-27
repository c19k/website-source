module.exports = function (api) {
  api.cache(false);
  return {
    plugins: [
      "lodash", // transforms/strips unused lodash deps.
      "@babel/transform-runtime",
    ],
    presets: [
      [
        "@babel/preset-env",
        {
          useBuiltIns: "entry",
          modules: "auto",
        },
      ],
    ],
  };
};
