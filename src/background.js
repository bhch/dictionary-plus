// const URI = "http://localhost:4000/api/dictionary/get";
const URI = "https://pawtools.org/api/dictionary";

// Look up for term definition
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "fetch-meaning") {
    return;
  }

  let uri = URI + "/get?term=" + message.term;

  sendRequest(
    uri,
    (json) => {
      if (json.data) {
        let dictionaryData = parse(json.data);
        sendResponse(dictionaryData);
      } else {
        sendResponse(null);
      }
    },
    (error) => {
      sendResponse({
        term: message.term,
        error: error.toString(),
      });
    }
  );

  return true;
});

// Fetch term suggestion
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "fetch-suggestion") {
    return;
  }

  let uri = URI + "/search?term=" + message.term;

  sendRequest(
    uri,
    (json) => {
      if (json.data) {
        sendResponse(json.data);
      } else {
        sendResponse(null);
      }
    },
    (error) => {
      sendResponse({
        term: message.term,
        error: error.toString(),
      });
    }
  );

  return true;
});

function sendRequest(uri, callback, errorCallback) {
  fetch(uri, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((json) => callback(json))
    .catch((error) => errorCallback(error));
}

function parse(json) {
  return {
    term: json.term,
    phonetic: "/" + json.phonetic + "/",
    definition: json.details,
    type: null,
    audio: null,
  };
}
