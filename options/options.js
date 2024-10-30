document.getElementById('openSettingsBtn').addEventListener('click', (e) => {
  browser.tabs.create({
    url: "../pages/saved-list.html#settingsModal"
  });
});
