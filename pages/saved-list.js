function updateSavedCounter() {
  browser.storage.local.get('saved')
  .then((item) => {
    const saved = item.saved || {};
    const totalSaved = Object.keys(saved).length;
    const counter = document.getElementById('savedCounterHeading');
    const exportButton = document.getElementById('exportButton');
    if (totalSaved > 0) {
      counter.textContent = browser.i18n.getMessage('savedListPageTitle') + ' (' + totalSaved + ')';
      exportButton.classList.remove('d-none');
    }
    else {
      counter.textContent = '';
      exportButton.classList.add('d-none');
    }
  });
}


function populateWords() {
  browser.storage.local.get('saved')
  .then((item) => {
    const saved = item.saved || {};

    const container = document.getElementById('wordsContainer');

    const words = Object.keys(saved).reverse();

    if (!words.length) {
      const emptyMsg = document.createElement('h2');
      emptyMsg.setAttribute('class', 'empty-msg');
      emptyMsg.textContent = browser.i18n.getMessage('emptyListMessage');
      container.appendChild(emptyMsg);
    }


    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      const data = saved[word];

      let panel = document.createElement('div');
      panel.setAttribute('class', 'word-panel');

      let header = document.createElement('div');
      header.setAttribute('class', 'header');

      let audio;
      let btnListen;

      if (data.audio) {
        audio = document.createElement('audio');
        audio.setAttribute('src', data.audio);
        audio.setAttribute('preload', 'auto');

        btnListen = document.createElement('button');
        btnListen.setAttribute('class', 'btn btn-listen');
        btnListen.setAttribute('type', 'button');
        btnListen.setAttribute('title', browser.i18n.getMessage('pronounceBtnTitle'));

        btnListen.onclick = function(e) {
          audio.play();
        };
      }

      let term = document.createElement('span');
      term.setAttribute('class', 'term');
      term.textContent = word;

      let content = document.createElement('div');
      content.setAttribute('class', 'content');

      let phonetic = document.createElement('div');
      phonetic.setAttribute('class', 'phonetic');
      phonetic.textContent = data.phonetic;

      let type = document.createElement('div');
      type.setAttribute('class', 'type');
      type.textContent = data.type;

      let definition = document.createElement('div');
      definition.setAttribute('class', 'definition');
      definition.textContent = data.definition;

      let linkMore = document.createElement('a');
      linkMore.setAttribute('class', 'link-more');
      linkMore.setAttribute('href', 'https://google.com/search?q=define+' + word);
      linkMore.setAttribute('target', '_blank');
      linkMore.textContent = browser.i18n.getMessage('moreBtnLabel');
      linkMore.setAttribute('title', browser.i18n.getMessage('moreBtnTitle'));

      let footer = document.createElement('div');
      footer.setAttribute('class', 'footer');

      let btnRemove = document.createElement('button');
      btnRemove.setAttribute('class', 'btn btn-remove');
      btnRemove.textContent = browser.i18n.getMessage('removeBtnLabel');
      btnRemove.setAttribute('title', browser.i18n.getMessage('removeBtnTitle'));
      btnRemove.onclick = function(e) {
        removeWord(word);
      }

      container.appendChild(panel);
      
      panel.appendChild(header);
      header.appendChild(term);
      if (audio) {
        header.appendChild(audio);
        header.appendChild(btnListen);
      }

      panel.appendChild(content);
      content.appendChild(phonetic);
      content.appendChild(type);
      content.appendChild(definition);

      panel.appendChild(footer);
      footer.appendChild(btnRemove);
      footer.appendChild(linkMore);
    }

  });

}


function removeWord(word) {
  const modal = document.getElementById('confirmRemoveModal');
  modal.classList.remove('hide');

  const confirmButton = document.getElementById('confirmButton').addEventListener('click', (e) => {
    browser.storage.local.get('saved')
    .then((item) => {
      const saved = item.saved || {};
      delete saved[word];
      browser.storage.local.set({saved: {...saved}})
      .then(() => window.location.reload());
    });
  });
}


function onStorageChange(changes, area) {
  const saved = changes.saved;

  if (!saved)
    return;

  // ask user to reload page
  const reloadPrompt = document.getElementById('reloadPrompt');
  reloadPrompt.classList.remove('hide');
}


browser.storage.onChanged.addListener(onStorageChange);


function closeModal(e) {
  document.getElementById('confirmRemoveModal').classList.add('hide');
}

document.getElementById('confirmRemoveModal').addEventListener('click', function(e) {
  if (e.target === this)
    closeModal(e);
});
document.getElementById('cancelButton').addEventListener('click', closeModal);


function updateSettings(key, value) {
  browser.storage.local.get('settings')
    .then((item) => {
      const settings = item.settings || {};
      settings[key] = value;
      browser.storage.local.set({settings: {...settings}});
    });
}

function setTheme() {
  browser.storage.local.get('settings')
  .then((item) => {
    const settings = item.settings || {};
    if (settings.theme) {
      if (settings.theme === 'dark') {
        document.body.classList.add('dark');
        Array.from(document.querySelectorAll('input[name="theme"]')).forEach((el) => {
          el.checked = el.value === 'dark';
        });
      }
    }
  });
}


function toggleTheme(e) {
  const theme = e.target.value;

  if (theme === 'dark')
    document.body.classList.add('dark');
  else
    document.body.classList.remove('dark');

  updateSettings('theme', theme);
}

Array.from(document.querySelectorAll('input[name="theme"]')).forEach((el) => {
  el.addEventListener('click', toggleTheme);
});


function setDblClickTrigger() {
  browser.storage.local.get('settings')
  .then((item) => {
    const settings = item.settings || {};
    if (settings.hasOwnProperty('dblClickTrigger')) {
      if (!settings.dblClickTrigger) {
        document.querySelector('input[name="dblClickTrigger"]').checked = false;
      }
    }
  });
}

function toggleDblClickTrigger(e) {
  updateSettings('dblClickTrigger', e.target.checked);
}

document.querySelector('input[name="dblClickTrigger"]').addEventListener('click', toggleDblClickTrigger);


document.querySelectorAll('.modal-open').forEach((el) => {
  el.addEventListener('click', (e) => {
    document.querySelector(el.dataset.target).classList.remove('hide');
  });
});

document.querySelectorAll('.modal-close').forEach((el) => {
  el.addEventListener('click', (e) => {
    document.querySelector(el.dataset.target).classList.add('hide');
  });
});

document.querySelectorAll('.modal').forEach((el) => {
  el.addEventListener('click', (e) => {
    if (e.target === el)
      el.classList.add('hide');
  });
});


document.getElementById('exportDownloadButton').addEventListener('click', (e) => {
  browser.storage.local.get('saved')
  .then((item) => {
    const saved = item.saved || {};

    const container = document.getElementById('wordsContainer');

    const words = Object.keys(saved).reverse();

    if (!words.length)
      return;

    const options = Array.from(document.querySelectorAll('input[name="export_options"]:checked')).map((i) => i.value);

    const rows = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const data = saved[word];
      const row = [];
      if (options.includes('words'))
        row.push(word);
      if (options.includes('types'))
        row.push(data.type);
      if (options.includes('definitions'))
        row.push(data.definition);

      rows.push(row);
    }

    function processRow(row) {
      let finalVal = '';
      for (let i = 0; i < row.length; i++) {
        let innerValue = row[i] === null ? '' : row[i].toString();
        let result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0)
            result = '"' + result + '"';
        if (i > 0)
            finalVal += ',';
        finalVal += result;
      }
      return finalVal + '\n';
    };

    let csvFile = '';
    for (let i = 0; i < rows.length; i++) {
      csvFile += processRow(rows[i]);
    }

    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'dictonary-plus-vocabulary.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('This feature is not supported by your browser');
    }
  });
});


(function () {
  // Populate localised strings
  document.getElementsByTagName('title')[0].textContent = browser.i18n.getMessage('extensionName') + ' - ' + browser.i18n.getMessage("savedListPageTitle");
  document.getElementById('extensionName').textContent = browser.i18n.getMessage("extensionName");
  document.getElementById('confirmButton').textContent = browser.i18n.getMessage("confirmRemoveBtnLabel");
  document.getElementById('cancelButton').textContent = browser.i18n.getMessage("cancelBtnLabel");
  document.querySelector('#confirmRemoveModal .dialog-heading h3').textContent = browser.i18n.getMessage("removeModalTitle");
  document.querySelector('#confirmRemoveModal .dialog-body').textContent = browser.i18n.getMessage("removeModalBody");
  document.getElementById('reloadPrompt').innerHTML = browser.i18n.getMessage('reloadMessage');
  document.getElementById('footerMsg').innerHTML = browser.i18n.getMessage('footerMessage', 'https://github.com/bhch/dictionary-plus');
  document.getElementById('menuItemSettings').textContent = browser.i18n.getMessage("settingsLabel");
  document.querySelector('#settingsModal .dialog-heading h3').textContent = browser.i18n.getMessage("settingsLabel"); 
  document.getElementById('themeSettingLabel').textContent = browser.i18n.getMessage("changeThemeLabel");
  document.getElementById('themeLightLabel').textContent = browser.i18n.getMessage("themeLightLabel");
  document.getElementById('themeDarkLabel').textContent = browser.i18n.getMessage("themeDarkLabel");
  // TODO: add translations for double trigger settings
  document.getElementById('closeSettingsModalButton').textContent = browser.i18n.getMessage("closeBtnTitle");
  document.getElementById('exportButton').textContent = browser.i18n.getMessage("exportBtnLabel");
  document.getElementById('closeExportModalButton').textContent = browser.i18n.getMessage("closeBtnTitle");

  updateSavedCounter();
  populateWords();
  setTheme();
  setDblClickTrigger();
})();