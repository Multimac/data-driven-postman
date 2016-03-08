exports.name = "Status Code Matches";

exports.run = function(result, response, data) {
  if(response.code === data) {
    result.passed = true;
  }
  else {
    result.messages.push("status code does not match, ${response} !== ${data}");
  }

  return result;
};
