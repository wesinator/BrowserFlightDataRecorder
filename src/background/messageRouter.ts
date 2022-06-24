browser.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {
    if (msg.type === "downloadHtml") {
        downloadHtmlOnBeforeUnload(msg);
    } else if (msg.type === "getTabId") {
        sendResponse({ tabId: sender.tab.id });
    }
});
