function takeHtmlSnapshot(): string {
    for (let input of document.getElementsByTagName("input")) {
        input.setAttribute("value", input.value);
    }

    for (let ta of document.getElementsByTagName("textarea")) {
        ta.innerText = ta.value;
    }

    return document.documentElement.outerHTML;
}

function sendPageInfo(html: string): void {
    browser.runtime.sendMessage({ type: "getTabId" }).then((msg: any) => {
        browser.runtime.sendMessage({
            type: "downloadHtml",
            timestamp: Date.now(),
            url: location.href,
            html: html,
            tabId: msg.tabId,
        });
    });
}

addEventListener("beforeunload", event => { sendPageInfo(takeHtmlSnapshot()); });
