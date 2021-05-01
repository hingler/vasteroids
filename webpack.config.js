const path = require("path");

module.exports = {
  entry: {
    index: "./client/ts/index.ts",
    drawtest: "./client/ts/drawtest.ts"
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: "/node_modules/"
      }
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "client/js")
  }
}