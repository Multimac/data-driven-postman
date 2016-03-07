/* POSTMAN VARIABLES */
var data = {
  test: {
    debug: undefined,
    data: {
      body : {

      },
      code : 200
    }
  }
};
var environment = { };
var globals = { };
var iteration = 0;
var postman = {
  getResponseHeader: (name => null)
};
var request = {
  data: { },
  headers: { },
  method: "GET",
  url: "http://localhost/test"
};
var responseCode = {
  code: 200,
  detail: "OK",
  name: "OK"
};
var responseBody = "{ \"Hello\" : \"World\" }";
var responseTime = 200;
var tests = { };
var xml2Json = (xml => xml);

/*
  Returns a default value when the given value is undefined.
*/
var defaultUndefined = function(value, def) {
  return (value === undefined) ? def : value;
};
/*
  Returns the first defined variable in an array, or a default
  variable.
*/
var firstDefinedOrDefault = function(values, def) {
  values.reduceRight((prev, curr) => {
    return defaultUndefined(curr, prev);
  }, def);
};

const fs = require("fs");

/*
  Whether or not to display debug messages while running tests.
  Defining 'forceDebug' will override all settings in data files,
  environments and globals
*/
const forceDebug = undefined;
const debug = firstDefinedOrDefault([
  forceDebug,
  data.test.debug,
  environment.debug,
  globals.debug
])

const core = require("./core.js");

var testDir = "./tests/";

var response = {
  code: responseCode,
  time: responseTime,

  body: {
    raw: responseBody,

    /* Attempt to parse the body as JSON to save repeated parsing. */
    json: (function() {
      try { return JSON.parse(responseBody); } catch (e) { }
    }()),

    /* Attempt to parse the body as XML to save repeated parsing. */
    xml: (function() {
      try { return xml2json(responseBody); } catch (e) { }
    }())
  },

  getHeader: (name => postman.getResponseHeader(name))
}
var testData = {
  iteration: iteration,
  request: request,
  response: response
}

/*
  Returns an array of tests to run. Each is assumed to have
  a 'run' method.
*/
var findTests = function(path) {
  if(debug) {
    console.log("findTests");
    console.log(path);
  }

  return fs.readdirSync(path)
    .map(filename => {
      var testExports = require(`${testDir}/${filename}`);
      return {
        exports: testExports,
        filename: filename,

        name: testExports.name,
        run: testExports.run
      };
    }).filter(test => {
      var validTest = test.exports.hasOwnProperty("run");
      if(!validTest)
        console.log(`'${test.filename}' is not a valid test`);

      return validTest;
    });
}

var runTestChecks = function(tests, data) {
  if(debug) {
    console.log("runTestChecks");
    console.log(tests);
    console.log(data);
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
