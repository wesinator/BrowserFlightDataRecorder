const BFDR_VERSION = "2.1.0";
const browserSessionId = Math.round(Math.random() * 10000000000000).toString();
function getBfdrHeader(url, timestamp, tabId) {
    let bfdrHeader = "";
    bfdrHeader += "BrowserFlightDataRecorder\n";
    bfdrHeader += `version:${BFDR_VERSION}\n`;
    bfdrHeader += `timestamp:${timestamp}\n`;
    bfdrHeader += `browserSessionId:${browserSessionId}\n`;
    bfdrHeader += `tabId:${tabId}\n`;
    bfdrHeader += `url:${url}\n`;
    return bfdrHeader;
}
function getDomainFromUrl(url) {
    if (url.startsWith("https://")) {
        url = url.substring("https://".length);
    }
    else if (url.startsWith("http://")) {
        url = url.substring("http://".length);
    }
    return url.split("/")[0];
}
function downloadAsHtml(msg) {
    const timestamp = Number(msg.timestamp);
    const url = msg.url;
    const html = msg.html;
    const tabId = Number(msg.tabId);
    console.log(tabId + "@" + browserSessionId);
    console.log(url);
    const bfdrContent = getBfdrHeader(url, timestamp, tabId) + "\n" + html;
    const blob = new Blob([bfdrContent], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    browser.downloads.download({
        url: downloadUrl,
        filename: `BFDR-${timestamp}.${getDomainFromUrl(url)}.html`,
    });
}
browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "downloadHtml") {
        downloadAsHtml(msg);
    }
});
