const path = require("path");

module.exports = {
  entry: "./client/ts/index.ts",
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
    filename: "index.js",
    path: path.resolve(__dirname, "client/js")
  }
}