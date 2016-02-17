// Set to true for more verbose logging
var debug = false;

// Add tests to this Array
// Each entry in this array is called with an object in the test.checks array (or
// the test.checks itself if it's not an array).
var responseTests = [
  (data) => responseTest(JSON.parse(responseBody), data.response),
  (data) => statusCodeTest(responseCode.code, data.code)
];

var runTestChecks = function(checks) {
  if(debug) {
    console.log("runTestChecks");
    console.log(checks);
  }

  var runTestSet = function(testData) {
    var results = responseTests.map(func => func(testData));

    return {
      "passed" : results.reduce((prev, test) => { return prev && test.passed; }, true),
      "tests" : results.reduce((prev, test) => { prev[test.name] = test.passed; return prev; }, { }),
      "messages" : results.reduce((prev, test) => { return prev.concat(test.messages) }, [ ])
    };
  };

  var setResults = [ ];
  if(Array.isArray(checks)) {
    checks.forEach(function(testData, i) {
      var results = runTestSet(testData);

      results.messages = results.messages.map(function(msg) {
        return `Check ${i}: ${msg}`;
      });

      setResults.push(results);
    });
  }
  else {
    setResults.push(runTestSet(checks));
  }

  return setResults;
};
var collateTestChecks = function(setResults) {
  if(debug) {
    console.log("collateTestChecks");
    console.log(setResults);
  }

  var testResults = {
    "passed" : false,
    "tests" : { },
    "messages" : [ ]
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
  var checks = { };
  if(typeof(test) === "undefined") {
    console.log("No test object provided, skipping tests.");
  }
  else {
    console.log(`Iteration ${iteration}: ${test.name}`);

    checks = test.checks;
  }

  var setResults = runTestChecks(checks);
  var testResults = collateTestChecks(setResults);

  submitTestResults(testResults);
}

// TESTS
// Add all tests between here and the call to main() below.
var createTestResults = function(name) {
  return {
    "name" : name,
    "passed" : null,
    "messages" : [ ]
  }
}
var responseTest = function(responseData, testData) {
  var result = createTestResults("Response Matches");

  if(typeof(testData) === "undefined") {
    result.passed = true;
  }
  else if(typeof(responseData) === testData) {
    result.passed = true;
  }
  else if(typeof(responseData) !== typeof(testData)) {
    result.passed = false;

    result.messages.push(`variable type does not match, ${responseData} !== ${testData}`);
  }
  else if(Array.isArray(testData) && responseData.length < testData.length) {
    result.passed = false;

    result.messages.push(`array length does not match, ${responseData.length} < ${testData.length}`);
  }
  else if(Array.isArray(testData)) {
    result.passed = true;

    for(var i = 0; i < testData.length; i++) {
      var expected = testData[i];
      var received = responseData[i];

      var checkResults = responseTest(received, expected);

      result.passed = result.passed && checkResults.passed;

      checkResults.messages.forEach(function(msg, i) {
        result.messages.push(`[${i}] => ${msg}`);
      });
    }
  }
  else if(typeof(testData) === "object") {
    result.passed = true;

    for (var index in testData) {
      if(!testData.hasOwnProperty(index)) {
        continue;
      }

      var expected = testData[index];
      var received = responseData[index];

      var checkResults = responseTest(received, expected);

      result.passed = result.passed && checkResults.passed;

      // Combine messages
      checkResults.messages.forEach(function(msg, i) {
        result.messages.push(`${index} => ${msg}`);
      });
    }
  }
  else if(responseData !== testData) {
    result.passed = false;

    result.messages.push(`variable does not match, ${responseData} !== ${testData}`);
  }
  else {
    result.passed = true;
  }

  return result;
};
var statusCodeTest = function(responseData, testData) {
  var result = createTestResults("Status Code Matches");

  if(typeof(testData) === "undefined") {
    result.passed = true;
  }
  else if(responseData !== testData) {
    result.passed = false;

    result.messages.push(`status code does not match, ${responseData} !== ${testData}`);
  }
  else {
    result.passed = true;
  }

  return result;
};


// Add any tests above this line
main(data.test);
