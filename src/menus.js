browser.menus.create({
  id: "search-dictionary",
  title: browser.i18n.getMessage('contextMenu'),
  contexts: ["selection"]
});

browser.menus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId == "search-dictionary") {
    // const text = info.selectionText;
    const sending = browser.tabs.sendMessage(
      tab.id,
      {
        type: 'context-menu',
        data: 'open-popup'
      },
    )
  }
});