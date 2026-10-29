let SETTINGS = {};

browser.storage.local.get('settings')
.then((item) => {
  SETTINGS = item.settings || {}; // use OR because item.settings may be undefined
                                  // which would also make the SETTINGS variable undefined
});

browser.storage.onChanged.addListener((changes, area) => {
  if (changes.settings)
    SETTINGS = changes.settings.newValue || {};
});

const LookupLocales = ['en-GB', 'en-US', 'de-DE', 'ru-UA'];

function buildAttempts(locales) {
  const attempts = [];

  for (const locale of locales) {
    for (const provider of DefinitionProviders) {
      if (provider.supportsLocale(locale)) {
        attempts.push({provider, locale});
      }
    }
  }

  return attempts;
}

const BaseDefinitionProvider = {
  defaultLocale: 'en-GB',

  supportsLocale: function(locale) {
    return this.baseUris.hasOwnProperty(locale);
  },

  getBaseUri: function(locale) {
    return this.baseUris[locale];
  },

  fetch: function({term, locale, successCallback, emptyCallback, errorCallback}) {
    if (!this.supportsLocale(locale)) {
      emptyCallback();
      return;
    }

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

  parseFromFeaturedSearch: function(doc) {
    const span = doc.querySelector('div[data-attrid="wa:/description"] span span');

    if (span)
      return {definition: span.textContent};
  }
};


const WiktionaryProvider = {
  __proto__: BaseDefinitionProvider,

  name: 'WiktionaryProvider',

  baseUris: {
    'de-DE': 'https://de.wiktionary.org/w/api.php',
    'ru-UA': 'https://ru.wiktionary.org/w/api.php',
  },

  getLookupUri: function(term, locale) {
    const params = new URLSearchParams({
      action: 'parse',
      page: term,
      prop: 'text',
      format: 'json',
      formatversion: '2',
      redirects: '1',
    });

    return this.getBaseUri(locale) + '?' + params.toString();
  },

  parse: function(term, locale, textResponse) {
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (error) {
      return false;
    }

    if (data.error || !data.parse) {
      return false;
    }

    const html = typeof data.parse.text === 'string' ? data.parse.text : data.parse.text?.['*'];
    if (!html) {
      return false;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const definition = this.extractDefinition(doc);
    if (!definition) {
      return false;
    }

    return {
      term: data.parse.title || term,
      phonetic: '',
      definition: definition,
      type: this.extractType(doc, locale),
      example: '',
      audio: null,
    };
  },

  extractDefinition: function(doc) {
    const candidates = [
      ...doc.querySelectorAll('.mw-parser-output ol > li'),
      ...doc.querySelectorAll('.mw-parser-output dl > dd'),
    ];

    for (const candidate of candidates) {
      candidate.querySelectorAll('sup, .reference, style, table').forEach((el) => el.remove());
      let text = candidate.textContent.replace(/\s+/g, ' ').trim();
      text = text.replace(/^\[\d+\]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();

      if (text.length) {
        return text;
      }
    }

    return '';
  },

  extractType: function(doc, locale) {
    const typeWords = locale === 'ru-UA' ? ['существительное', 'глагол', 'прилагательное', 'наречие'] : ['Substantiv', 'Verb', 'Adjektiv', 'Adverb'];

    const text = doc.body.textContent;
    return typeWords.find((typeWord) => text.includes(typeWord)) || '';
  },
};


/* List of definition providers by priority */
const DefinitionProviders = [
  YahooProvider,
  GoogleWebSearchProvider,
  WiktionaryProvider,
];


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type !== 'fetch-meaning') {
    return;
  }

  const attempts = buildAttempts(LookupLocales);
  const term = message.term;

  function runAttempt(attemptIndex, term, error) {
    if (attemptIndex >= attempts.length) {
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

    const { provider, locale } = attempts[attemptIndex];

    provider.fetch({
      term: term,
      locale: locale,
      successCallback: (data) => sendResponse(data),
      emptyCallback: () => runAttempt(attemptIndex + 1, term, null),
      errorCallback: (error) => runAttempt(attemptIndex + 1, term, error),
    });
  }

  runAttempt(0, term, null);

  return true;

});


function sendRequest(uri, locale, callback, errorCallback) {

  let headers = new Headers({
    'Accept-Language': locale,
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
