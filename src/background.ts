const BFDR_VERSION: string = "3.0.0";

const browserSessionId = Math.round(Math.random() * 10000000000000).toString();

function getBfdrHeader(url: string, timestamp: Number, tabId: Number): string {
    let bfdrHeader: string = "";
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

function downloadAsHtml(msg: any): void {
    const timestamp: Number = Number(msg.timestamp);
    const url: string = msg.url;
    const html: string = msg.html;
    const tabId: Number = Number(msg.tabId);

    const bfdrContent: string = getBfdrHeader(url, timestamp, tabId) + "\n" + html;

    const blob = new Blob([bfdrContent], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    browser.downloads.download({
        url: downloadUrl,
        filename: `BFDR-${timestamp}.${getDomainFromUrl(url)}.html`,
    });
}

class KeyValuePair {
    public key: string;
    public value: string;
}

class HttpFlight {
    private _tabId: Number;
    private _requestMethod: string;
    private _responseMethod: string;

    private _requestBody: string;
    private _responseBody: string;

    private _requestTimestamp: Number;
    private _requestUrl: string;

    private _fromCache: boolean;

    private _statusCode: Number;
    private _statusLine: string;
    private _responseTimestamp: Number;
    private _responseUrl: string;

    private _requestHeaders: Array<KeyValuePair>;
    private _responseHeaders: Array<KeyValuePair>;

    public constructor() {

    }

    public setRequest(request: any): void {
        this._requestMethod = request.method;
        this._requestTimestamp = request.timeStamp;
        this._requestUrl = request.url;
        this._requestHeaders = Array<KeyValuePair>();
        for (let kv of request.requestHeaders) {
            this._requestHeaders.push({ key: kv.name, value: kv.value });
        }
        this._tabId = request.tabId;
    }

    public setRequestBody(requestBody: string): void {
        this._requestBody = requestBody;
    }

    public setResponse(response: any): void {
        this._responseMethod = response.method;
        this._responseTimestamp = response.timeStamp;
        this._responseUrl = response.url;
        this._responseHeaders = Array<KeyValuePair>();
        for (let kv of response.responseHeaders) {
            this._responseHeaders.push({ key: kv.name, value: kv.value });
        }
        this._statusCode = response.statusCode;
        this._statusLine = response.statusLine;
    }

    public setResponseBody(responseBody: string): void {
        this._responseBody = responseBody;
    }

    public toString(): string {
        let ret = "";
        ret += this.getBfdrHeader();
        ret += "\n";

        for (let kv of this._requestHeaders) {
            ret += `${kv.key}:${kv.value}\n`;
        }
        ret += "\n";

        ret += (this._requestBody === null ? "" : this._requestBody) + "\n";
        ret += "\n";

        for (let kv of this._responseHeaders) {
            ret += `${kv.key}:${kv.value}\n`;
        }
        ret += "\n";

        ret += (this._responseBody === null ? "" : this._responseBody) + "\n";
        ret += "\n";

        return ret;
    }

    private getBfdrHeader(): string {
        let header = "";
        header += "BrowserFlightDataRecorder\n";
        header += `version:${BFDR_VERSION}\n`;
        header += `browserSessionId:${browserSessionId}\n`;
        header += `tabId:${this._tabId}\n`;
        header += `requestTimestamp:${this._requestTimestamp}\n`;
        header += `requestMethod:${this._requestMethod}\n`;
        header += `requestUrl:${this._requestUrl}\n`;
        header += `fromCache:${this._fromCache ? "true" : "false"}\n`;
        header += `responseTimestamp:${this._responseTimestamp}\n`;
        header += `responseMethod:${this._responseMethod}\n`;
        header += `responseUrl:${this._responseUrl}\n`;
        header += `statusCode:${this._statusCode}\n`;
        header += `statusLine:${this._statusLine}\n`;
        return header;
    }
}

let httpFlights: Map<Number, Map<string, HttpFlight>> = new Map<Number, Map<string, HttpFlight>>();

function saveResponse(details: any): void {
    const tabId = details.tabId;
    const requestId = details.requestId;
    if (!httpFlights.has(tabId)) {
        httpFlights.set(tabId, new Map<string, HttpFlight>());
    }
    httpFlights.get(tabId).set(requestId, new HttpFlight());
    httpFlights.get(tabId).get(requestId).setRequestBody(details.requestBody);

    let filter = browser.webRequest.filterResponseData(requestId);

    const decorder = new TextDecoder();
    let responseBody = "";
    filter.ondata = event => {
        filter.write(event.data);
        responseBody += decorder.decode(event.data, { stream: true });
    };
    filter.onstop = event => {
        filter.close();
        httpFlights.get(tabId).get(requestId).setResponseBody(responseBody);

        const blob = new Blob([httpFlights.get(tabId).get(requestId).toString()], { type: "text/plain" });
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

browser.webRequest.onBeforeRequest.addListener(saveResponse, { urls: ["*://*/*"] }, ["blocking", "requestBody"]);
browser.webRequest.onSendHeaders.addListener(details => {
    httpFlights.get(details.tabId).get(details.requestId).setRequest(details);
}, { urls: ["*://*/*"] }, ["requestHeaders"]);

browser.webRequest.onHeadersReceived.addListener(details => {
    httpFlights.get(details.tabId).get(details.requestId).setResponse(details);
}, { urls: ["*://*/*"] }, ["responseHeaders"]);

browser.runtime.onMessage.addListener((msg: any, sender: browser.runtime.MessageSender, sendResponse: any) => {
    if (msg.type === "downloadHtml") {
        downloadAsHtml(msg);
    } else if (msg.type === "getTabId") {
        sendResponse({ tabId: sender.tab.id });
    }
});
