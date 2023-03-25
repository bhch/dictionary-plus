const DICTIONARY_URI_BASE = "https://www.google.com/async/callback:5493?fc=EswBCowBQUVzN2pOUkF1SzlOems0NzJ2azkyX3RkUE0tOWt6RE1tcWdnbjdjZlNXQ3FPOUg4SVNKNlZPSWdsMTJoUkdhcFFKTDVQR09aV2t1QVJIcm9SeUR5N1RVQm1pWGM5ZFJheTVPVXBtSWp4a2ttb0duMU8zRl9YSTdhY1ZfZFU1dUJTV2hJcUZmN2ZWZ2USFzdLRWVaTU9XTkxfYzQtRVAxTWlkcUFZGiJBTy0wcmw3eDFjLXotV2lWNFFNSW5QTnZuOC1tTXBTMzdR&fcv=3&vet=12ahUKEwjdra7G5az1AhUK6XMBHQGdAxkQg4MCegQIEBAB..i&ved=2ahUKEwj3lKvJ5az1AhUL_XMBHeKbCTgQu-gBegQIARAN&yv=3&oq=buy&async=hhdr:true,hwdgt:true,wfp:true,ttl:,tsl:en,ptl:hi,_fmt:prog,_id:fc_2"

const DICTIONARY_URIS = [
  DICTIONARY_URI_BASE + ',corpus:en',
  DICTIONARY_URI_BASE + ',corpus:en-US', // for american IP addresses (VPN etc) // Note: this parameter has stopped working since 25 Mar, 2023
]

const SEARCH_URI = 'https://www.google.com/search';

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type !== 'fetch-meaning') {
    return;
  }

  /*:TODO:
  The following nested functions code is a dirty fix.
  Use and chain promises instead.
  */

  let uri = DICTIONARY_URIS[0] + ',term:' + message.term;

  sendRequest(
    uri,
    (text) => {
      let dictionaryData = parse(text, 'dictionary');

      if (!dictionaryData)  {
        /* Try second URI */

        uri = DICTIONARY_URIS[1] + ',term:' + message.term;

        sendRequest(
          uri,
          (text) => {
            let dictionaryData = parse(text, 'dictionary');

            if (!dictionaryData)  {
              /* Nothing found in dictionary, try from search results */

              uri = SEARCH_URI + '?q=define+' + message.term;

              sendRequest(
                uri,
                (text) => {
                  dictionaryData = parse(text, 'search');
                  sendResponse(dictionaryData);
                },
                (error) => {
                  sendResponse({
                    term: message.term,
                    error: error.toString()
                  });
                }
              );
            }
            
            if (dictionaryData)
              sendResponse(dictionaryData);
          },
          (error) => {
            sendResponse({
              term: message.term,
              error: error.toString()
            });
          }
        );
      }
      
      if (dictionaryData)
        sendResponse(dictionaryData);
    },
    (error) => {
      sendResponse({
        term: message.term,
        error: error.toString()
      });
    }
  );

  return true;

});


function sendRequest(uri, callback, errorCallback) {

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
  .then((text) => callback(text))
  .catch((error) => errorCallback(error));
}


function fromDictionary(doc) {
  if (!doc.querySelector('span[data-dobid="hdw"]')) /* No definition returned */
    return false;

  // we use the term returned by the dictionary 
  // as it converts plurals to singulars, etc.
  const term = doc.querySelector('span[data-dobid="hdw"]').textContent.trim();

  let phonetic = '';
  /*
  Note: Google has stopped returning phonetic data since 25 Mar, 2023

  const phoneticEl = doc.querySelector('span[data-dobid="hdw"]').parentElement
    .parentElement.nextElementSibling

  if (phoneticEl)
    phonetic = phoneticEl.textContent.trim();
  */

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
