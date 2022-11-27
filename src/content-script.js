import PopupContent from "./PopupContent.svelte";
const LOADING_MESSAGE = browser.i18n.getMessage("loadingMessage");
const NO_DEFINITION_MESSAGE = browser.i18n.getMessage("noDefinitionMessage");
const OPENED_POPUPS = {};

let SETTINGS = {};

browser.storage.local.get("settings").then((item) => {
  SETTINGS = item.settings || {};
});

function getSelectionData() {
  const selection = window.getSelection();

  const rect = selection.getRangeAt(0).getBoundingClientRect();

  const data = {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    height: rect.height,
    width: rect.width,
    term: selection.toString().toLowerCase().trim(),
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

  let offsetLeft = -(width / 2);
  const startingPointX = centerX + offsetLeft;
  const endingPointX = centerX + width / 2;

  if (startingPointX - 10 < 0) {
    offsetLeft = offsetLeft + startingPointX * -1 + 10;
  }

  if (endingPointX + 10 > window.innerWidth + window.scrollX) {
    offsetLeft =
      offsetLeft - (endingPointX + 20 - window.innerWidth - window.scrollX);
  }

  let startingPointY = centerY + boundingRect.height / 2 + beakSize; // top
  let endingPointY = startingPointY + height;
  let position = "bottom";

  if (endingPointY + 30 > window.innerHeight + window.scrollY) {
    startingPointY = centerY - boundingRect.height / 2 - beakSize - height;
    position = "top";
  }

  const coords = {
    top: startingPointY,
    left: centerX - beakSize / 2,
    offsetLeft: offsetLeft,
    position: position,
  };

  return coords;
}

function createPopUp(text) {
  const selectionData = getSelectionData();
  const term = selectionData.term || text;
  if (!term.trim().length) return;

  const key = generateRandomKey();

  let wrapper = document.createElement("div"); // outer wrapper for the popup used for shadow dom
  wrapper.setAttribute("class", "dictionary-plus-popup-wrapper");
  wrapper.style = "z-index: 900000";

  const popUpWidth = 300;
  const popUpHeight = 150;

  const placement = getPlacementCoords(
    popUpWidth,
    popUpHeight,
    10,
    selectionData
  );

  let btnClose = document.createElement("button");
  btnClose.setAttribute("class", "btn btn-close");
  btnClose.setAttribute("type", "button");
  btnClose.setAttribute("title", browser.i18n.getMessage("closeBtnTitle"));
  btnClose.onclick = function (e) {
    destroyPopUp(key);
  };

  document.body.appendChild(wrapper);
  try {
    const pop = new PopupContent({
      target: wrapper,
      props: {
        placement: placement,
        width: popUpWidth,
        height: popUpHeight,
        term: term,
      },
    });
  } catch (e) {
    console.log(e);
  }

  OPENED_POPUPS[key] = { node: wrapper, selectionData: { ...selectionData } };
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
  if (message.type === "context-menu") {
    /* from context menu */
    if (message.data === "open-popup") {
      // :TODO: don't open popup if already open for current selection
      // or maybe close previous popups before opening new
      createPopUp();
    }
  }
});
document.addEventListener("dblclick", (e) => {
  debug();
  createPopUp();
});

document.addEventListener("click", (e) => {
  // Destroy all poups ONLY when the click is not on a popup
  if (!e.target.classList.contains("dictionary-plus-popup-wrapper")) {
    let popups = { ...OPENED_POPUPS };
    Object.keys(popups).map((key) => destroyPopUp(key));
  }
});

function onStorageChange(changes, area) {
  const settings = changes.settings;

  if (!settings) return;

  // update settings
  SETTINGS = settings.newValue;
}

browser.storage.onChanged.addListener(onStorageChange);

window.addEventListener("keyup", (e) => {
  if (e.ctrlKey && e.key == "F") {
    createPopUp();
  }
});
