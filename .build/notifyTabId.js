browser.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text == "what is my tab_id?") {
        sendResponse({ tabId: sender.tab.id });
    }
});
