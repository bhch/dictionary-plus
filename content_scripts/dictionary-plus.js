import { getStyles } from './helpers.js';

const LOADING_MESSAGE = browser.i18n.getMessage('loadingMessage');
const NO_DEFINITION_MESSAGE = browser.i18n.getMessage('noDefinitionMessage');
const OPENED_POPUPS = {};

const popUpWidth = 300;
const popUpHeight = 300;

let SETTINGS = {};

browser.storage.local.get('settings')
    .then((item) => {
      SETTINGS = item.settings || {}
    });


function getSelectionData() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect();
  const term = selection.toString().toLowerCase().trim();
  if (!term) {
    return null;
  }

  const data = {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    height: rect.height,
    width: rect.width,
    term
  };

  data.centerX = data.left + rect.width / 2;
  data.centerY = data.top + rect.height / 2;

  return data;
}


function getPlacementCoords(width, height, beakSize, boundingRect) {
  /*
    Params: 
    width: width of the popup
    height: height of the popup
    beakSize: size of the beak to account for
    boundingRect: bounding rect object of the selection
  */

  const centerX = boundingRect.left + window.scrollX + boundingRect.width / 2;
  const centerY = boundingRect.top + window.scrollY + boundingRect.height / 2;

  let offsetLeft = - (width / 2);
  const startingPointX = centerX + offsetLeft;
  const endingPointX = centerX + width / 2;

  if (startingPointX - 10 < 0) {
    offsetLeft = offsetLeft + (startingPointX * - 1) + 10;
  }

  if (endingPointX + 10 > window.innerWidth + window.scrollX) {
    offsetLeft = offsetLeft - (endingPointX + 20 - window.innerWidth - window.scrollX);
  }

  let startingPointY = centerY + (boundingRect.height / 2) + beakSize; // top
  let endingPointY = startingPointY + height;
  let position = 'bottom';

  if (endingPointY + 30 > window.innerHeight + window.scrollY) {
    startingPointY = centerY - (boundingRect.height / 2) - beakSize - height;
    position = 'top';
  }

  return {top: startingPointY, left: centerX, offsetLeft: offsetLeft, position: position};
}


function createPopUp() {
  const selectionData = getSelectionData();
  if (!selectionData) {
    return;
  }

  // Components declaration
  let style = document.createElement('style');
  let wrapper = document.createElement('div');
  let shadow = wrapper.attachShadow({mode: 'open'});

  // Initialization
  // assigns random id for popup
  const key = generateRandomKey();
  wrapper.setAttribute('class', 'dictionary-plus-popup-wrapper');

  const placement = getPlacementCoords(popUpWidth, popUpHeight, 10, selectionData);

  style.textContent = getStyles(
    placement,
    popUpHeight,
    popUpWidth,
    SETTINGS.theme || 'light',
  );

  let container = document.createElement('div');
  container.setAttribute('class', 'container popup-' + placement.position);
  container.style.top = placement.top + 'px';

  let popup = document.createElement('div'); // inner popup
  popup.setAttribute('class', 'popup');

  let beak = document.createElement('div');
  beak.setAttribute('class', 'beak');

  let header = document.createElement('div');
  header.setAttribute('class', 'header');

  let btnListen = document.createElement('button');
  btnListen.setAttribute('class', 'btn btn-listen hide');
  btnListen.setAttribute('type', 'button');
  btnListen.setAttribute('title', browser.i18n.getMessage("pronounceBtnTitle"));

  let btnClose = document.createElement('button');
  btnClose.setAttribute('class', 'btn btn-close');
  btnClose.setAttribute('type', 'button');
  btnClose.setAttribute('title', browser.i18n.getMessage("closeBtnTitle"));
  btnClose.onclick = function(e) {
    destroyPopUp(key);
  };

  let term = document.createElement('span');
  term.setAttribute('class', 'term');

  const selectedText = selectionData.term;
  term.textContent = selectedText;

  let content = document.createElement('div');
  content.setAttribute('class', 'content');

  let phonetic = document.createElement('div');
  phonetic.setAttribute('class', 'phonetic');

  let type = document.createElement('div');
  type.setAttribute('class', 'type');

  let definition = document.createElement('div');
  definition.setAttribute('class', 'definition');
  definition.textContent = LOADING_MESSAGE;

  let example = document.createElement('div');
  example.setAttribute('class', 'example');

  let linkMore = document.createElement('a');
  linkMore.setAttribute('class', 'link-more');
  linkMore.setAttribute('href', 'https://google.com/search?q=define+' + selectedText);
  linkMore.setAttribute('target', '_blank');
  linkMore.textContent = browser.i18n.getMessage("moreBtnLabel");
  linkMore.setAttribute('title', browser.i18n.getMessage("moreBtnTitle"));

  let footer = document.createElement('div');
  footer.setAttribute('class', 'footer');

  let btnSave = document.createElement('button');
  btnSave.setAttribute('class', 'btn btn-save');
  btnSave.textContent = browser.i18n.getMessage("saveBtnLabel");
  btnSave.setAttribute('title', browser.i18n.getMessage("saveBtnTitle"));
  btnSave.onclick = function(e) {
    saveWord(key);
  }

  let labelSave = document.createElement('span');
  labelSave.setAttribute('class', 'btn label-save hide');
  labelSave.textContent = browser.i18n.getMessage("savedBtnLabel");
  labelSave.setAttribute('title', browser.i18n.getMessage("savedBtnTitle"));

  shadow.appendChild(style);
  shadow.appendChild(container);

  container.appendChild(beak);
  container.appendChild(popup);

  footer.appendChild(btnSave);
  footer.appendChild(labelSave);
  footer.appendChild(linkMore);
  header.appendChild(btnClose);
  header.appendChild(btnListen);
  header.appendChild(term);
  content.appendChild(phonetic);
  content.appendChild(type);
  content.appendChild(definition);
  content.appendChild(example);

  popup.appendChild(header);
  popup.appendChild(content);
  popup.appendChild(footer);

  document.body.appendChild(wrapper);

  OPENED_POPUPS[key] = {node: wrapper, selectionData: {...selectionData}};

  updateSaveBtn(key, selectionData.term);

  let sending = browser.runtime.sendMessage({
    type: 'fetch-meaning',
    term: selectionData.term
  });

  sending.then((response) => {
    updatePopUp(key, response);
  });
}


function getPopUpElements(key) {
  /*Returns important children elemnts of a popup */
  const node = OPENED_POPUPS[key].node;
  const popup = node.shadowRoot;
  return {
    node: node,
    shadowRoot: popup,
    term: popup.querySelector('.term'),
    definition: popup.querySelector('.definition'),
    example: popup.querySelector('.example'),
    phonetic: popup.querySelector('.phonetic'),
    type: popup.querySelector('.type'),
    audio: popup.querySelector('audio'),
    btnSave: popup.querySelector('.btn-save'),
    labelSave: popup.querySelector('.label-save'),
  }
}


function updateSaveBtn(key, term) {
  /* Checks if the current term is saved or not. 
  If it is saved, hides the Save button and shows Saved label.
  */

  browser.storage.local.get('saved')
      .then((item) => {
        const saved = item.saved || {};

        if (saved[term]) {
          const popup = getPopUpElements(key);
          popup.btnSave.classList.add('hide');
          popup.labelSave.classList.remove('hide');
        }
      });

};


function saveWord(key) {
  const popup = getPopUpElements(key);

  const term = popup.term.textContent;
  let definition = popup.definition.textContent;
  if (definition === LOADING_MESSAGE || definition === NO_DEFINITION_MESSAGE)
    definition = '';
  const phonetic = popup.phonetic.textContent;
  const type = popup.type.textContent;
  let audio;
  if (popup.audio)
    audio = popup.audio.getAttribute('src');

  /* Save object structure
    {
      saved: {
        word: {
          definition:
          phonetic:
          audio:
          type:
        }, 
        word: {...}, ...
      } 
    } 
  */

  browser.storage.local.get('saved')
      .then((item) => {
        let saved = item.saved || {};

        let newSaved = {
          saved: {
            ...saved,
            [term]: {
              definition: definition,
              phonetic: phonetic,
              type: type,
              audio: audio,
            }
          }
        };

        browser.storage.local.set(newSaved).then(() => {
          popup.btnSave.classList.add('hide');
          popup.labelSave.classList.remove('hide');
        });
      });
}


function updatePopUp(key, data) {
  const popupNode = OPENED_POPUPS[key].node;

  const popup = popupNode.shadowRoot;

  if (!data) {
    popup.querySelector('.definition').textContent = NO_DEFINITION_MESSAGE;
    return;
  }

  if (data.term)
    popup.querySelector('.term').textContent = data.term;

  if (data.error) {
    let definition = popup.querySelector('.definition');
    definition.textContent = 'Error:';

    let definitionError = document.createElement('div');
    definitionError.setAttribute('class', 'error');
    definitionError.textContent = data.error;
    definition.appendChild(definitionError);

    let reportProblem = document.createElement('a');
    reportProblem.setAttribute('class', 'link-more report-problem');
    reportProblem.setAttribute('href', 'https://forms.gle/pYwAEfTLjZibeyPFA');
    reportProblem.setAttribute('target', '_blank');
    reportProblem.textContent = 'Report problem';
    definition.appendChild(reportProblem);

  }
  else {
    popup.querySelector('.phonetic').textContent = data.phonetic;
    popup.querySelector('.type').textContent = data.type;
    popup.querySelector('.definition').textContent = data.definition;
    popup.querySelector('.example').textContent = data.example ? 'E.g.: ' + data.example : '';
  }

  if (data.audio) {
    let audio = document.createElement('audio');
    audio.setAttribute('src', data.audio);
    audio.setAttribute('preload', 'auto');
    popup.appendChild(audio);

    let audioBtn = popup.querySelector('.btn-listen');
    audioBtn.classList.remove('hide');
    audioBtn.onclick = function(e) {
      audio.play();
    };
  }

  updateSaveBtn(key, data.term);

  // Update position if popup is on top
  const container = popup.querySelector('.container');
  if (container.classList.contains('popup-top')) {
    const popUpHeight = 150;
    const popupInner = popup.querySelector('.popup');
    container.style.top = parseInt(container.style.top) - (popupInner.getBoundingClientRect().height - popUpHeight) + 'px';
  }
}


function destroyPopUp(key) {
  const popup = OPENED_POPUPS[key];

  popup.node.remove();

  delete OPENED_POPUPS[key];
}


const USED_KEYS = [];

function generateRandomKey() {
  let key;

  while (key === undefined || !isNaN(+key) || USED_KEYS.includes(key)) {
    key = Math.random().toString(36).substring(7);
  }

  USED_KEYS.push(key);
  return key;
}


browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'context-menu') { /* from context menu */
    if (message.data === 'open-popup') {
      // :TODO: don't open popup if already open for current selection
      // or maybe close previous popups before opening new
      createPopUp();
    }
  }
});


document.addEventListener('dblclick', (e) => {
  if (SETTINGS.hasOwnProperty('dblClickTrigger')) {
    if (!SETTINGS.dblClickTrigger)
      return;
  }

  createPopUp();
});


document.addEventListener('click', (e) => {
  // Destroy all poups ONLY when the click is not on a popup
  if(!e.target.classList.contains("dictionary-plus-popup-wrapper")) {
    let popups = {...OPENED_POPUPS};
    Object.keys(popups).map((key) => destroyPopUp(key));
  }
});


function onStorageChange(changes, area) {
  const settings = changes.settings;

  if (!settings)
    return;

  // update settings
  SETTINGS = settings.newValue;
}

browser.storage.onChanged.addListener(onStorageChange);
