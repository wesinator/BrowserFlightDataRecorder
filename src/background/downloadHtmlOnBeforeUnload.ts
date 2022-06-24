function downloadHtmlOnBeforeUnload(msg: any): void {
    function getBfdrHeader(url: string, timestamp: Number, tabId: Number): string {
        let bfdrHeader = "";
        bfdrHeader += "BrowserFlightDataRecorder\n";
        bfdrHeader += `version:${BFDR_VERSION}\n`;
        bfdrHeader += `timestamp:${timestamp}\n`;
        bfdrHeader += `browserSessionId:${browserSessionId}\n`;
        bfdrHeader += `tabId:${tabId}\n`;
        bfdrHeader += `url:${url}\n`;

        return bfdrHeader;
    }

    function getDomainFromUrl(url: string): string {
        if (url.startsWith("https://")) {
            url = url.substring("https://".length);
        } else if (url.startsWith("http://")) {
            url = url.substring("http://".length);
        }
        return url.split("/")[0];
    }

    const timestamp: Number = Number(msg.timestamp);
    const url: string = msg.url;
    const html: string = msg.html;
    const tabId: Number = Number(msg.tabId);

    const bfdrContent = getBfdrHeader(url, timestamp, tabId) + "\n" + html;

    const blob = new Blob([bfdrContent], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    browser.downloads.download({
        url: downloadUrl,
        filename: `BFDR-${timestamp}.${getDomainFromUrl(url)}.html`,
    });
}
