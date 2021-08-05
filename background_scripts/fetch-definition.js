const DICTIONARY_URI = "https://www.google.com/async/callback:5493?fc=ErYBCndBTlVfTnFRTnhPUmJTOXR5Tjc2RjBfUWNzZ1hpcVdaYWJjNk5YWEJyQnhqZmdJQnJyNGZaeU92S2pRZ2VZWHZ4dVc1eUNRbGNacVNGU3hoQkJNNEk2bWxQY3plSW9ZVDJzUHRoSWgySERqZEQ2cnBQdnBEZEZHdxIXR000TFlaWHZGSkNINC1FUHRNMkhvQTQaIkFPTVlSd0R6VE45bzE5d0FXZEY3amZCdzhBNEQxMVc1cmc&fcv=3&vet=12ahUKEwiV24uM5pnyAhWQwzgGHbTmAeQQg4MCMAJ6BAgFEAE..i&ved=0CAEQu-gBahcKEwi4-vCO5pnyAhUAAAAAHQAAAAAQAw&yv=3&oq=indeed&async=corpus:en,hhdr:true,hwdgt:true,wfp:true,ttl:,tsl:en,ptl:,_fmt:prog,_id:fc_4";
const SEARCH_URI = 'https://www.google.com/search';

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type !== 'fetch-meaning') {
    return;
  }

  let uri = DICTIONARY_URI + ',term:' + message.term;
  //let uri = SEARCH_URI + '?q=define+' + message.term;

  sendRequest(uri, (text) => {
    let dictionaryData = parse(text, 'dictionary');

    if (!dictionaryData)  {
      /* Nothing found in dictionary, try from search results */

      uri = SEARCH_URI + '?q=define+' + message.term;

      sendRequest(uri, (text) => {
        dictionaryData = parse(text, 'search');
        sendResponse(dictionaryData);
      });
    }
    
    if (dictionaryData)
      sendResponse(dictionaryData);
  })

  return true;

});


function sendRequest(uri, callback) {

  let headers = new Headers({
    'Accept-Language': 'en-GB,en;q=0.7,en-US;q=0.3',
    'Cookie': ''
  });

  fetch(uri, {
    method: 'GET',
    credentials: 'omit',
    headers: headers
  })
  .then((response) => response.text())
  .then((text) => callback(text));
}


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


function parse(htmlString, type) {
  let doc = new DOMParser().parseFromString(htmlString, 'text/html');

  if (type === 'dictionary')
    return fromDictionary(doc);

  let data = fromKnowledgePanel(doc);

  if (!data)
    data = fromFeaturedSearch(doc);

  return data;
}
