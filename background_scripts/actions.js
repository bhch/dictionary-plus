function openListPage() {
  browser.tabs.create({
  	url: "/pages/saved-list.html"
  })
}

browser.browserAction.onClicked.addListener(openListPage);