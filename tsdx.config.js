// see: https://github.com/formium/tsdx#rollup

// TODO: track https://github.com/formium/tsdx/issues/961 for possible better solution

const path = require("path");

const relativePath = p => path.join(__dirname, p);

module.exports = {
  rollup(config, options) {
    if (options.format === "esm") {
      // we use this to output separate chunk for /src/validators
      // see: https://stackoverflow.com/a/65173887
      return {
        ...config,
        input: [
          relativePath("src/index.ts"),
          relativePath("src/validators/index.ts"),
        ],
        output: {
          ...config.output,
          file: undefined,
          dir: relativePath("dist/esm"),
          preserveModules: true,
          preserveModulesRoot: relativePath("src"),
        },
      };
    } else {
      return config;
    }
  },
};
