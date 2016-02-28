const fs = require("fs");

// Set to true for more verbose logging
var debug = false;
var testDir = "./tests/";

var core = require("./core.js");

var data = { test: { } };
var iteration = 0;
var responseCode = { code: 200, name: "OK" };
var responseTime = 200;
var responseBody = "{ \"Hello\" : \"World\" }";
var postman = { getResponseHeader: ((name) => null) };
var tests = { }

var response = {
  code: responseCode,
  time: responseTime,

  body: {
    text: responseBody,
    json: JSON.parse(responseBody)
  },

  getHeader: ((name) => postman.getResponseHeader(name))
};

var findTests = function(path) {
  if(debug) {
    console.log("findTests");
    console.log(path);
  }

  return fs.readdirSync(path)
    .map(filename => require(`${testDir}/${filename}`))
    .filter(test => test.hasOwnProperty("run"));
}
var runTestChecks = function(tests, data) {
  if(debug) {
    console.log("runTestChecks");
    console.log(tests);
  }

  var runTestSet = function(tests, data) {
    var runTest = function(test, data) {
      var results = test.run(core, response, data);
      results.name = test.name;

      return results;
    }

    var results = tests.map(test => runTest(test, data));

    return {
      passed: results.reduce((prev, test) => { return prev && test.passed; }, true),
      tests: results.reduce((prev, test) => { prev[test.name] = test.passed; return prev; }, { }),
      messages: results.reduce((prev, test) => { return prev.concat(test.messages) }, [ ])
    };
  };

  var setResults = [ ];
  if(Array.isArray(data)) {
    data.forEach(function(d, i) {
      var results = runTestSet(tests, d);

      results.messages = results.messages.map(function(msg) {
        return `Check ${i}: ${msg}`;
      });

      setResults.push(results);
    });
  }
  else {
    setResults.push(runTestSet(tests, data));
  }

  return setResults;
};
var collateTestChecks = function(setResults) {
  if(debug) {
    console.log("collateTestChecks");
    console.log(setResults);
  }

  var testResults = {
    passed: false,
    tests: { },
    messages: [ ]
  };

  setResults.forEach(function(set) {
    testResults.passed = testResults.passed || set.passed;
    testResults.messages = testResults.messages.concat(set.messages);

    for(var k in set.tests) {
      if(typeof(testResults.tests[k]) === "undefined") {
        testResults.tests[k] = true;
      }

      testResults.tests[k] = testResults.tests[k] && set.tests[k];
    }
  });

  return testResults;
};
var submitTestResults = function(testResults) {
  if(debug) {
    console.log("submitTestResults");
    console.log(testResults);
  }

  for (var k in testResults.tests) {
    tests[k] = testResults.tests[k] || testResults.passed;
  }

  if(!testResults.passed) {
    testResults.messages.forEach(msg => console.log(msg));
  }
}

var main = function(test) {
  var data = { };
  if(typeof(test) === "undefined") {
    console.log("No test object provided, skipping tests.");
  }
  else {
    console.log(`Iteration ${iteration}: ${test.name}`);

    data = test.data;
  }

  var tests = findTests(testDir);
  var setResults = runTestChecks(tests);
  var testResults = collateTestChecks(setResults);

  console.log(tests);
  console.log(setResults);
  console.log(testResults);

  submitTestResults(testResults);
}

main(data.test);
