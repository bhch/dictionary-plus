let SETTINGS = {};

browser.storage.local.get('settings')
.then((item) => {
  SETTINGS = item.settings || {}; // use OR because item.settings may be undefined 
                                  // which would also make the SETTINGS variable undefined
});

browser.storage.onChanged.addListener((changes, area) => {
  SETTINGS = changes.settings.newValue;
});


const BaseDefinitionProvider = {
  defaultLocale: 'en-GB',
  
  getBaseUri: function(locale) {
    if (!this.baseUris.hasOwnProperty(locale))
      locale = this.defaultLocale;

    return this.baseUris[locale];
  },

  fetch: function({term, locale, successCallback, emptyCallback, errorCallback}) {
    const uri = this.getLookupUri(term, locale);

    sendRequest(
      uri,
      locale,
      (textResponse) => {

        const data = this.parse(term, locale, textResponse);

        if (!data)
          emptyCallback(data);
        else
          successCallback(data);
      },
      (error) => {
        errorCallback(error);
      }
    );
  }
};


const YahooProvider = {
  __proto__: BaseDefinitionProvider,

  name: 'YahooProvider',

  baseUris: {
    'en-GB': 'https://uk.search.yahoo.com/search?fr2=p:s,v:w,m:dict-sb&p=',
    'en-US': 'https://search.yahoo.com/search?fr2=p:s,v:w,m:dict-sb&p=',
  },

  getLookupUri: function(term, locale) {
    const baseUri = this.getBaseUri(locale);
    return baseUri + 'define+' + term;
  },

  parse: function(term, locale, textResponse) {
    const doc = new DOMParser().parseFromString(textResponse, 'text/html');
    const containerEl = doc.querySelector('.sys_dictionary');
    
    if (!containerEl)
      return;

    const termEl = containerEl.querySelectorAll('.compTitle')[1];
    const phoneticEl = containerEl.querySelectorAll('.compTitle')[2];
    const typeEl = containerEl.querySelector('.compTitle + .compText');
    const definitionItemEl = containerEl.querySelector('.compTextList ul li');
    
    if (!definitionItemEl)
      return;

    const definitionEl = definitionItemEl.children[1];

    if (!definitionEl)
      return;

    let definition = definitionEl.textContent;
    if (!definition)
      return;

    definition = definition.trim();

    if (definition.endsWith(':'))
      definition = definition.substring(0, definition.length - 1)

    const exampleEl = definitionItemEl.children[2];

    const audioRe = /\.sys_dictionary \.compTitle \.audio.*(https:\/\/.*\.mp3)/gms;

    const audioMatch = audioRe.exec(textResponse);
    let audio = '';
    if (audioMatch)
      audio = audioMatch[1];

    return {
      term: termEl ? termEl.textContent : term,
      phonetic: phoneticEl ? phoneticEl.textContent : '',
      definition: definition,
      type: typeEl ? typeEl.textContent : '',
      example: exampleEl ? exampleEl.textContent : '',
      audio: audio,
    }
  }
};


const GoogleAjaxProvider = {
  __proto__: BaseDefinitionProvider,

  name: 'GoogleAjaxProvider',

  baseUri: 'https://www.google.com/async/callback:5493?fc=EswBCowBQUpHOUprTTRjV1J0YXNBdV9TdDczbmlCbXRMRGdrUEQ1OTQ5cGh3aG90TzVGU1dvVEM5d1hGTEZJN19POVVMZDJtb2xjVmxfU3duYkF0TnNEVGl2VW5LaWtDVTZKd1Nkck1iam0xRUJzOFJwbXlEQm5RRUR1ZGtkQzdnaFFYenFrb3FXNG54d21iSzQSF1lPMVdac183R3ZySTFzUVBnb3FJeVFVGiJBRlhyRWNvZUlicGhtVWsyc25Eb3NSMkw0WV81em1DYTR3&fcv=3&vet=12ahUKEwjPq9O8vrKGAxV6pJUCHQIFIlkQg4MCegQIJBAB..i&ved=2ahUKEwjPq9O8vrKGAxV6pJUCHQIFIlkQmp0CegQIJBBI&yv=3&oq=buy&async=hhdr:true,hwdgt:true,wfp:true,ttl:,tsl:en,ptl:hi,_fmt:prog,_id:fc_2',

  baseUris: {
    'en-GB': this.baseUri + ',corpus:en',
    'en-US': this.baseUri + ',corpus:en-US', // for american IP addresses (VPN etc) // Note: this parameter has stopped working since 25 Mar, 2023
  },

  getLookupUri: function(term, locale) {
    const baseUri = this.getBaseUri(locale);
    return baseUri + ',term:' + term;
  },

  parse: function(term, locale, textResponse) {
    const doc = new DOMParser().parseFromString(textResponse, 'text/html');

    if (!doc.querySelector('div[data-bkt="dictionary"]')) /* No definition returned */
      return false;

    const termEl = doc.querySelector('div[data-maindata]');
    const termData = termEl.dataset.maindata;
    const termRegex = /(dictionary_term",")(\w+)/gm;
    const termMatches = [...termData.matchAll(termRegex)];
    let term2;
    if (termMatches.length) {
      try {
          term2 = termMatches[0][2];
      } catch (err) {
          term2 = null;
      }
    }

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
      term: term2 || term,
      phonetic: phonetic,
      definition: definition,
      type: type,
      audio: audio
    };
  }
};


const GoogleWebSearchProvider = {
  __proto__: BaseDefinitionProvider,

  name: 'GoogleWebSearchProvider',

  baseUris: {
    'en-GB': 'https://www.google.com/search',
    'en-US': 'https://www.google.com/search',
  },

  getLookupUri: function(term, locale) {
    const baseUri = this.getBaseUri(locale);
    return baseUri + '?q=define+' + term;
  },

  parse: function(term, locale, textResponse) {
    const doc = new DOMParser().parseFromString(textResponse, 'text/html');

    let data;

    data = this.parseFromSearchDictionary(doc);

    if (!data)
      data = this.parseFromKnowledgePanel(doc);

    if (!data)
      data = this.parseFromFeaturedSearch(doc);

    return data;
  },

  parseFromSearchDictionary: function(doc) {
    /* Extract definition from dictionary data on the search page */

    if (!doc.querySelector('div[data-bkt="dictionary"]')) /* No definition returned */
      return false;

    // we use the term returned by the dictionary 
    // as it converts plurals to singulars, etc.
    const termEl = doc.querySelector('div[data-bkt="dictionary"][data-maindata]');
    const termData = termEl.dataset.maindata;
    const termRegex = /(dictionary_term",")(\w+)/gm;
    const termMatches = [...termData.matchAll(termRegex)];
    let term;
    if (termMatches.length) {
      try {
          term = termMatches[0][2];
      } catch (err) {
          term = null;
      }
    }

    let phonetic = '';
    /*
    Note: Google has stopped returning phonetic data since 25 Mar, 2023

    const phoneticEl = doc.querySelector('span[data-dobid="hdw"]').parentElement
      .parentElement.nextElementSibling

    if (phoneticEl)
      phonetic = phoneticEl.textContent.trim();
    */

    const definition = doc.querySelector('div[data-psd^="sense_definition"]').dataset.psd.split('sense_definition~:&')[1];

    let type = '';
    let typeEl = doc.querySelector('div[class~="YrbPuc"]');
    
    if (typeEl)
      type = typeEl.textContent;

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
  },

  parseFromKnowledgePanel: function(doc) {
    const span = doc.querySelector('#rhs div[data-attrid="description"] span');
    
    if (span)
      return {definition: span.textContent};
  },

  praseFromFeaturedSearch: function(doc) {
    const span = doc.querySelector('div[data-attrid="wa:/description"] span span');

    if (span)
      return {definition: span.textContent};
  }
};


/* List of definition providers by priority */
const DefinitionProviders = [
  YahooProvider,
  GoogleAjaxProvider,
  GoogleWebSearchProvider,
];


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type !== 'fetch-meaning') {
    return;
  }

  const locale = SETTINGS.locale || window.navigator.language;
  const term = message.term;

  function runProvider(providerIndex, term, locale, error) {
    if (providerIndex >= DefinitionProviders.length) {
      /* Tried all providers and nothing was found. */
      if (error) {
        sendResponse({
            term: term,
            error: error.toString()
          });
      } else {
        sendResponse(null);
      }
      return true;
    }

    const provider = DefinitionProviders[providerIndex];

    provider.fetch({
      term: term,
      locale: locale,
      successCallback: (data) => sendResponse(data),
      emptyCallback: () => runProvider(providerIndex + 1, term, locale, null),
      errorCallback: (error) => runProvider(providerIndex + 1, term, locale, error),
    });
  }

  runProvider(0, term, locale, null);

  return true;

});


function sendRequest(uri, locale, callback, errorCallback) {

  let headers = new Headers({
    'Accept-Language': locale === 'en-US' ? 'en-US,en;q=0.7,en-GB;q=0.3' : 'en-GB,en;q=0.7,en-US;q=0.3',
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
