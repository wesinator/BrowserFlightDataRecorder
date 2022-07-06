let httpCommunications: Map<Number, Map<string, HttpCommunication>> = new Map<Number, Map<string, HttpCommunication>>();

function saveResponseBody(details: browser.webRequest._OnBeforeRequestDetails): void {
    browser.storage.local.get(["captureHttpCommunication",])
        .then(data => {
            if (data["captureHttpCommunication"] !== false) {
                const tabId: Number = details.tabId;
                const requestId: string = details.requestId;
                if (!httpCommunications.has(tabId)) {
                    httpCommunications.set(tabId, new Map<string, HttpCommunication>());
                }
                httpCommunications.get(tabId).set(requestId, new HttpCommunication(tabId));

                const reqBody = details.requestBody;
                httpCommunications.get(tabId).get(requestId).setRequestBody(reqBody === null ? "" : JSON.stringify(reqBody.formData));

                const filter = browser.webRequest.filterResponseData(requestId);
                const decorder = new TextDecoder();
                let responseBody = "";

                filter.ondata = event => {
                    filter.write(event.data);
                    responseBody += decorder.decode(event.data, { stream: true });
                };

                filter.onstop = event => {
                    filter.close();
                    httpCommunications.get(tabId).get(requestId).setResponseBody(responseBody);

                    const blob = new Blob([httpCommunications.get(tabId).get(requestId).toString()], { type: "text/plain" });
                    const downloadUrl = URL.createObjectURL(blob);

                    function getDomainFromUrl(url: string): string {
                        if (url.startsWith("https://")) {
                            url = url.substring("https://".length);
                        } else if (url.startsWith("http://")) {
                            url = url.substring("http://".length);
                        }
                        return url.split("/")[0];
                    }

                    browser.downloads.download({
                        url: downloadUrl,
                        filename: `BFDR-${Date.now()}.${Math.random().toString().substring(2, 7)}.${getDomainFromUrl(details.url)}.log`,
                    });
                };
            }
        });
}

browser.webRequest.onBeforeRequest.addListener(saveResponseBody, { urls: ["*://*/*"] }, ["blocking", "requestBody"]);

browser.webRequest.onSendHeaders.addListener(details => {
    if (httpCommunications.has(details.tabId) && httpCommunications.get(details.tabId).has(details.requestId)) {
        httpCommunications.get(details.tabId).get(details.requestId).setRequestHeaders(details);
    }
}, { urls: ["*://*/*"] }, ["requestHeaders"]);

browser.webRequest.onHeadersReceived.addListener(details => {
    if (httpCommunications.has(details.tabId) && httpCommunications.get(details.tabId).has(details.requestId)) {
        httpCommunications.get(details.tabId).get(details.requestId).setResponseHeaders(details);
    }
}, { urls: ["*://*/*"] }, ["responseHeaders"]);
