
/*
  A 'findTests' method will be prepended to this file when built, which
  will return an array of all tests loaded from the ./tests/ directory.

  The blank line above is important as that is where the method will be prepended
  without a trailing newline.
*/

const core = require("./core.js");

/*
  Whether or not to display debug messages while running tests.
  Defining 'forceDebug' will override all settings in data files,
  environments and globals
*/
const forceDebug = true;

/*
  The below is for mocking a Postman environment for testing within NodeJS.
*/
var data = {
  test: {
    debug: undefined,
    name: "Hello World",

    data: {
      'body.js' : {

      },
      'code.js' : 200
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
  Build response and test data
*/
var responseData = {
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
};
var postmanTestData = {
  iteration: iteration,
  request: request,
  response: responseData
};

/*
  Returns a default value when the given value is undefined.
*/
var defaultUndefined = function(value, def) {
  return (value !== undefined ? value : def);
};
/*
  Returns the first defined variable in an array, or a default
  variable.
*/
var firstDefinedOrDefault = function(values, def) {
  return values.reduceRight((prev, curr) => {
    return defaultUndefined(curr, prev);
  }, def);
};

/*
  Logs a method call to the console for debugging purposes.
*/
var debugMethodCall = function(methodName, params) {
  if(!debug)
    return;

  console.log(`Entering: ${methodName}`);
  for (var p in params) {
    if (params.hasOwnProperty(p))
      console.log(`> ${p} === ${params[p]}`);
  }
};

/*
  Mocks all tests for when we've either not got a data file or have run out of
  tests in the given data file. Returns an array with a single element representing
  the mocked test set.
*/
var mockTestChecks = function(tests) {
  return [
    {
      messages: [],
      passed: true,

      tests: results.reduce((prev, test) => {
        prev[test.name] = true;
        return prev;
      }, { })
    }
  ];
};
/*
  Runs all tests against the response, passing in their given section of
  data from the data file. A test file may contain multiple sets of tests for
  different scenarios. Returns an array of the results from all sets.
*/
var performTests = function(tests, completeTestData) {
  if(debug) {
    debugMethodCall("runTestChecks", { tests: tests, completeTestData: completeTestData});
  }

  /*
    Runs all tests using the given set of test data. Returns whether all
    tests in the set passed, as well as whether the individual tests passed and
    any messages from them.
  */
  var runTestSet = function(tests, setTestData) {
    /*
      Runs a single test using the data for that test. Returns the results of
      that test.
    */
    var runTest = function(test, testData) {
      var results = test.run(core.createTestResults(), postmanTestData, testData);
      results.name = test.name; // Copy the test name for future use.

      return results;
    }

    var results = tests.map(
      test => runTest(test, setTestData[test.filename])
    );

    return {
      messages: results.reduce((prev, test) => prev.concat(test.messages), [ ]),
      passed: results.reduce((prev, test) => prev && test.passed, true),

      tests: results.reduce((prev, test) => {
        prev[test.name] = test.passed;
        return prev;
      }, { })
    };
  };

  // If we have an array, then we class each object in the array as a set
  // of tests, otherwise we class the object as a single set of tests.
  var setResults = [ ];
  if(Array.isArray(completeTestData)) {
    completeTestData.forEach((setTestData, i) => {
      var results = runTestSet(tests, setTestData);

      results.messages = results.messages.map(
        msg => `Check ${i}: ${msg}`
      );

      setResults.push(results);
    });
  }
  else {
    setResults.push(runTestSet(tests, completeTestData));
  }

  return setResults;
};

/*
  Collates the results of all tests, returning the passing set if one exists or
  a set made up of all the failed results and messages from all sets.
*/
var collateTestChecks = function(setResults) {
  if(debug) {
    debugMethodCall("collateTestChecks", { setResults: setResults });
  }

  var passedSetResults = null;
  var collatedSetResults = {
    passed: false,
    tests: { },
    messages: [ ]
  };

  // Attempt to find a successful set, otherwise just collate all the messages
  // and failed tests.
  setResults.forEach(set => {
    if(set.passed)
      passedSetResults = set;

    if(passedSetResults != null)
      return;

    collatedSetResults.messages = collatedSetResults.messages.concat(set.messages);

    for(var k in set.tests) {
      if(!set.tests.hasOwnProperty(k))
        collatedSetResults.tests[k] = collatedSetResults.tests[k] && set.tests[k];
    }
  });

  return (passedSetResults !== null ? passedSetResults : collatedSetResults);
};

/*
  Processes test results into the Postman tests object and logs messages if
  the tests weren't successful.
*/
var submitTestResults = function(testResults) {
  if(debug) {
    debugMethodCall("submitTestResults", { testResults: testResults });
  }

  for (var k in testResults.tests) {
    tests[k] = testResults.tests[k] || testResults.passed;
  }

  if(!testResults.passed) {
    testResults.messages.forEach(msg => console.log(msg));
  }
}

/*
  Handles finding and running tests, and then submitting the results to Postman.
*/
var main = function(testingData) {
  if(debug) {
    debugMethodCall("main", { testingData: testingData });
  }

  var tests = findTests();

  var setResults = null;
  if(testingData === undefined) {
    console.log("No test object provided, mocking tests.");
    setResults = mockTestChecks(tests);
  }
  else {
    console.log(`Iteration ${iteration}: ${testingData.name}`);
    setResults = performTests(tests, testingData.data)
  }

  var testResults = collateTestChecks(setResults);

  submitTestResults(testResults);
}

/*
  Determine debugging status...
*/
const debug = firstDefinedOrDefault([
  forceDebug,
  data.test.debug,
  environment.debug,
  globals.debug
]);

if(debug)
  console.log("Debugging is enabled...");

main(data.test);
