class HttpCommunication {
    private _tabId: Number;

    private _requestUrl: string;
    private _requestTimestamp: Number;
    private _requestMethod: string;
    private _requestIp: string;
    private _requestProxyInfo: string;

    private _responseUrl: string;
    private _responseTimestamp: Number;
    private _responseMethod: string;
    private _responseIp: string;
    private _responseProxyInfo: string;
    private _statusLine: string;

    private _fromCache: boolean;

    private _requestBody: string;
    private _responseBody: string;

    private _requestHeaders: Array<KeyValuePair> = Array<KeyValuePair>();
    private _responseHeaders: Array<KeyValuePair> = Array<KeyValuePair>();

    public constructor(tabId: Number) {
        this._tabId = tabId;
    }

    public setRequestHeaders(request: any): void {
        this._requestUrl = request.url;
        this._requestTimestamp = request.timeStamp;
        this._requestMethod = request.method;
        this._requestIp = request.ip;
        this._requestProxyInfo = request.proxyInfo === null ? "" : JSON.stringify(request.proxyInfo);

        for (let kv of request.requestHeaders) {
            this._requestHeaders.push({ key: kv.name, value: kv.value });
        }
    }

    public setRequestBody(requestBody: string): void {
        this._requestBody = requestBody;
    }

    public setResponseHeaders(response: any): void {
        this._responseUrl = response.url;
        this._responseTimestamp = response.timeStamp;
        this._responseMethod = response.method;
        this._responseIp = response.ip;
        this._responseProxyInfo = response.proxyInfo === null ? "" : JSON.stringify(response.proxyInfo);

        for (let kv of response.responseHeaders) {
            this._responseHeaders.push({ key: kv.name, value: kv.value });
        }
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
        header += "type:HttpCommunication\n";

        header += `browserSessionId:${browserSessionId}\n`;
        header += `tabId:${this._tabId}\n`;

        header += `requestUrl:${this._requestUrl}\n`;
        header += `requestTimestamp:${this._requestTimestamp}\n`;
        header += `requestMethod:${this._requestMethod}\n`;
        header += `requestIp:${this._requestIp === null ? "" : this._requestIp}\n`;
        header += `requestProxyInfo:${this._requestProxyInfo === null ? "" : this._requestProxyInfo}\n`;

        header += `responseUrl:${this._responseUrl}\n`;
        header += `responseTimestamp:${this._responseTimestamp}\n`;
        header += `responseMethod:${this._responseMethod}\n`;
        header += `responseIp:${this._responseIp === null ? "" : this._responseIp}\n`;
        header += `responseProxyInfo:${this._responseProxyInfo === null ? "" : this._responseProxyInfo}\n`;
        header += `statusLine:${this._statusLine}\n`;
        header += `fromCache:${this._fromCache ? "true" : "false"}\n`;

        return header;
    }
}
