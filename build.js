const fs = require("fs");
const path = require("path");

const uglify = require("uglify-js");

const core = require("./core.js");

var baseFile = "./base.js";
var testDir = "./tests/";

var outputDir = "./bin/";
var outputFilename = "postman-test.js";

var globalPrepend = "var findTests = function() { return [";
var testPrepend = "(function(exports) {";
var testAppend = "return exports; }({ }))"
var testJoin = ", ";
var globalAppend = "] };";

/*
  Returns an array of tests to run. Each is assumed to have
  a 'run' method. Returns an array of all tests to be run.
*/
var buildIndividualTestContents = function(path) {
  core.debugMethodCall("buildTestContents", { path: path });

  return fs.readdirSync(path)
    .map(filename => {
      return fs.readFileSync(`${path}/${filename}`);
    }).map(contents => {
      return [ testPrepend, contents, testAppend ].join(" ");
    });
};
var buildCompleteTestContents = function(testContents) {
  return [ globalPrepend, testContents.join(testJoin), globalAppend ].join(" ");
};
var generateTestCode = function(contents) {
  try {
    return uglify.minify(contents, { fromString: true });
  } catch (e) {
    console.log(e);
  }
};
var prependTestsToBase = function(source) {
  var code = source.code.concat(fs.readFileSync(baseFile));

  try {
    fs.accessSync(outputDir, fs.F_OK);
  } catch (e) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(path.join(outputDir, outputFilename), code);
}

var main = function() {
  var individualTestContents = buildIndividualTestContents(testDir);
  var completeTestContents = buildCompleteTestContents(individualTestContents);
  var testSource = generateTestCode(completeTestContents);

  prependTestsToBase(testSource);
}

main();
