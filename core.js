/*
  Creates a test results object.
*/
exports.createTestResults = function() {
  return {
    passed: false,
    messages: [ ]
  }
}

/*
  Logs a method call to the console for debugging purposes.
*/
exports.debugMethodCall = function(methodName, params) {
  console.log(`Entering: ${methodName}`);
  for (var p in params) {
    if (params.hasOwnProperty(p))
      console.log(`> ${p} === ${params[p]}`);
  }
};
