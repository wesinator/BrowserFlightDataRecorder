class HttpCommunication {
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

    private _requestHeaders: Array<KeyValuePair> = Array<KeyValuePair>();
    private _responseHeaders: Array<KeyValuePair> = Array<KeyValuePair>();

    public constructor() {

    }

    public setRequestHeaders(request: any): void {
        this._requestMethod = request.method;
        this._requestTimestamp = request.timeStamp;
        this._requestUrl = request.url;
        for (let kv of request.requestHeaders) {
            this._requestHeaders.push({ key: kv.name, value: kv.value });
        }
        this._tabId = request.tabId;
    }

    public setRequestBody(requestBody: string): void {
        this._requestBody = requestBody;
    }

    public setResponseHeaders(response: any): void {
        this._responseMethod = response.method;
        this._responseTimestamp = response.timeStamp;
        this._responseUrl = response.url;
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
