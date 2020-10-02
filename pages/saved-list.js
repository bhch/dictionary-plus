function updateSavedCounter() {
  browser.storage.local.get('saved')
  .then((item) => {
    const saved = item.saved || {};
    const totalSaved = Object.keys(saved).length;
    const counter = document.getElementById('savedCounterHeading');
    if (totalSaved > 0)
      counter.textContent = 'Saved words (' + totalSaved + ')';
    else 
      counter.textContent = '';
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
      emptyMsg.textContent = 'Saved words will appear here';
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
        btnListen.setAttribute('title', 'Pronunciation');

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
      linkMore.textContent = 'More';
      linkMore.setAttribute('title', 'Full definition');

      let footer = document.createElement('div');
      footer.setAttribute('class', 'footer');

      let btnRemove = document.createElement('button');
      btnRemove.setAttribute('class', 'btn btn-remove');
      btnRemove.textContent = 'Remove';
      btnRemove.setAttribute('title', 'Remove word');
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

document.getElementById('confirmRemoveModal').addEventListener('click', closeModal);

document.getElementById('cancelButton').addEventListener('click', closeModal);


(function () {
    updateSavedCounter();
    populateWords();
})();