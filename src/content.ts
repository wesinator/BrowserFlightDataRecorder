function takeHtmlSnapshot(): string {
    for (let input of document.getElementsByTagName("input")) {
        input.setAttribute("value", input.value);
    }

    return document.documentElement.outerHTML;
}

function sendPageInfo(html: string, tabId: Number): void {
    browser.runtime.sendMessage({
        type: "downloadHtml",
        timestamp: Date.now(),
        url: location.href,
        html: html,
        tabId: tabId,
    });
}

browser.runtime.connect().onMessage.addListener((msg: any) => {
    addEventListener("beforeunload", event => { sendPageInfo(takeHtmlSnapshot(), msg.tabId); });
    addEventListener("dblclick", event => { sendPageInfo(takeHtmlSnapshot(), msg.tabId); });
});
