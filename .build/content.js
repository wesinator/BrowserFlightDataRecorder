function takeHtmlSnapshot() {
    for (let input of document.getElementsByTagName("input")) {
        input.setAttribute("value", input.value);
    }
    return document.documentElement.outerHTML;
}
const port = browser.runtime.connect();
function sendPageInfo(html) {
    browser.runtime.sendMessage({ text: "what is my tab_id?" }).then(msg => {
        console.log('My tabId is', msg.tabId);
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
addEventListener("dblclick", event => { sendPageInfo(takeHtmlSnapshot()); });
