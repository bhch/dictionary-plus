// const URI = "http://localhost:4000/api/dictionary/get";
const URI = "https://pawtools.org/api/dictionary/get";

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "fetch-meaning") {
    return;
  }

  let uri = URI + "?term=" + message.term;

  sendRequest(
    uri,
    (json) => {
      console.log(json);
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

function sendRequest(uri, callback, errorCallback) {
  fetch(uri, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((json) => callback(json))
    .catch((error) => errorCallback(error));
}

function renderSection(section) {
  const groupHtml = section.word_classes
    .map((item) => renderGroup(item))
    .join("\n");
  const meaningHtml = section.meanings
    .map((item) => renderMeaning(item))
    .join("\n");
  return `
<section class="level-1">
<div class="label">${section.name}</div>
${groupHtml}
<ul>
${meaningHtml}
</ul>
<section>
`;
}

function renderGroup(group) {
  const meaningHtml = group.meanings
    .map((item) => renderMeaning(item))
    .join("\n");
  return `<section class="level-2">
          <div class="label">${group.name}</div>
<ol>
    ${meaningHtml}
</ol>
        <section>
        `;
}

function renderMeaning(meaning) {
  const exampleHtml = meaning.examples
    .map((item) => {
      return `<li><span class="source">${item.source}</span> <br/> <span class="translation">${item.translation}</span>`;
    })
    .join("\n");

  return `
<li class="level-3">
<div class="label">${meaning.translation}</div>
<ul>
    ${exampleHtml}
</ul>
</li>
        `;
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
