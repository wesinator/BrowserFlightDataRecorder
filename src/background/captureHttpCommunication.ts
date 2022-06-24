let HttpCommunications: Map<Number, Map<string, HttpCommunication>> = new Map<Number, Map<string, HttpCommunication>>();

function saveResponseBody(details: browser.webRequest._OnBeforeRequestDetails): void {
    const tabId: Number = details.tabId;
    const requestId: string = details.requestId;
    if (!HttpCommunications.has(tabId)) {
        HttpCommunications.set(tabId, new Map<string, HttpCommunication>());
    }
    HttpCommunications.get(tabId).set(requestId, new HttpCommunication());
    HttpCommunications.get(tabId).get(requestId).setRequestBody(details.requestBody as string);

    const filter = browser.webRequest.filterResponseData(requestId);
    const decorder = new TextDecoder();
    let responseBody = "";
    filter.ondata = event => {
        filter.write(event.data);
        responseBody += decorder.decode(event.data, { stream: true });
    };
    filter.onstop = event => {
        filter.close();
        HttpCommunications.get(tabId).get(requestId).setResponseBody(responseBody);

        const blob = new Blob([HttpCommunications.get(tabId).get(requestId).toString()], { type: "text/plain" });
        const downloadUrl = URL.createObjectURL(blob);
        function getFilename(url: string): string {
            const dirs = url.split("?")[0].split("/");
            return dirs[dirs.length - 1];
        }
        browser.downloads.download({
            url: downloadUrl,
            filename: `BFDR-${Date.now()}.${getFilename(details.url)}`,
        });
    };
}

browser.webRequest.onBeforeRequest.addListener(saveResponseBody, { urls: ["*://*/*"] }, ["blocking", "requestBody"]);

browser.webRequest.onSendHeaders.addListener(details => {
    HttpCommunications.get(details.tabId).get(details.requestId).setRequestHeaders(details);
}, { urls: ["*://*/*"] }, ["requestHeaders"]);

browser.webRequest.onHeadersReceived.addListener(details => {
    HttpCommunications.get(details.tabId).get(details.requestId).setResponseHeaders(details);
}, { urls: ["*://*/*"] }, ["responseHeaders"]);
