exports.name = "Response Matches";

exports.run = function(core, response, data) {
  var result = core.createTestResults();

  if(typeof(response) === data) {
    result.passed = true;
  }
  else if(typeof(response) !== typeof(data)) {
    result.messages.push(`variable type does not match, ${response} !== ${data}`);
  }
  else if(Array.isArray(data) && response.length < data.length) {
    result.messages.push(`array length does not match, ${response.length} < ${data.length}`);
  }
  else if(Array.isArray(data)) {
    result.passed = true;

    for(var i = 0; i < data.length; i++) {
      var expected = data[i];
      var received = response[i];

      var checkResults = exports.test(received, expected);

      result.passed = result.passed && checkResults.passed;

      checkResults.messages.forEach(function(msg, i) {
        result.messages.push(`[${i}] => ${msg}`);
      });
    }
  }
  else if(typeof(data) === "object") {
    result.passed = true;

    for (var index in data) {
      if(!data.hasOwnProperty(index)) {
        continue;
      }

      var expected = data[index];
      var received = response[index];

      var checkResults = exports.test(received, expected);

      result.passed = result.passed && checkResults.passed;

      // Combine messages
      checkResults.messages.forEach(function(msg, i) {
        result.messages.push(`${index} => ${msg}`);
      });
    }
  }
  else if(response !== data) {
    result.messages.push(`variable does not match, ${response} !== ${data}`);
  }
  else {
    result.passed = true;
  }

  return result;
};
