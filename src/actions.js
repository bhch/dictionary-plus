function openListPage() {
  browser.tabs.create({
    url: "/saved-list.html",
  });
}

browser.browserAction.onClicked.addListener(openListPage);
