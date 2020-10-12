const REQUEST_URI = 'https://www.google.com/search';


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type !== 'fetch-meaning') {
    return;
  }

  let uri = REQUEST_URI + '?q=define+' + message.term;

  fetch(uri, { 
    method: 'GET',
    credentials: 'omit'
  })
  .then((response) => response.text())
  .then((text) => {
    const dictionaryData = parse(text);

    sendResponse(dictionaryData);

  });

  return true;

});


function fromDictionary(doc) {
  if (!doc.querySelector('span[data-dobid="hdw"]')) /* No definition returned */
    return false;

  // we use the term returned by the dictionary 
  // as it converts plurals to singulars, etc.
  const term = doc.querySelector('span[data-dobid="hdw"]').textContent.trim();

  let phonetic = '';
  const phoneticEl = doc.querySelector('span[data-dobid="hdw"]').parentElement
    .parentElement.nextElementSibling

  if (phoneticEl)
    phonetic = phoneticEl.textContent.trim();

  const definition = doc.querySelector('div[data-dobid="dfn"]').textContent;

  let type = '';
  let typeEl = doc.querySelector('div[data-dobid="dfn"]').closest('ol').previousElementSibling;

  if (typeEl.querySelector('i'))
    type = typeEl.querySelector('i').textContent;

  const audioEl = doc.querySelector('audio[jsname="QInZvb"] source');
  let audio = null;

  if (audioEl) {
    let src = audioEl.getAttribute('src');

    if (!src.startsWith('https'))
      src = 'https:' + src;

    audio = src;
  }

  return {
    term: term,
    phonetic: phonetic,
    definition: definition,
    type: type,
    audio: audio
  };
}


function fromKnowledgePanel(doc) {
  const span = doc.querySelector('#rhs div[data-attrid="description"] span');
  
  if (span)
    return {definition: span.textContent};
}


function fromFeaturedSearch(doc) {
  const span = doc.querySelector('div[data-attrid="wa:/description"] span span');

  if (span)
    return {definition: span.textContent};
}


function parse(htmlString) {
  let doc = new DOMParser().parseFromString(htmlString, 'text/html');

  let data = fromDictionary(doc);

  if (!data)
    data = fromKnowledgePanel(doc);

  if (!data)
    data = fromFeaturedSearch(doc);

  return data;
}
