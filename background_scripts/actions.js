function openListPage() {
    browser.tabs.create({
        url: "/pages/saved-list.html"
    })
}

browser.action.onClicked.addListener(openListPage);
