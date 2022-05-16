class ExternalResource {
    private _contentStr: string;
    private _contentBlob: Blob;
    private _mime: string = "image/png";
    private _isText: boolean = false;
    constructor(contentStr: string, contentBlob: Array<ArrayBuffer>, type: string, url: string) {
        if (url.startsWith("data:")) {
            this._isText = true;
            this._mime = url.split(";")[0].substring("data:".length);
        } else {
            this.detectMime(type, url);
        }
        this._contentStr = contentStr;
        this._contentBlob = new Blob(contentBlob, { type: this._mime });
    }

    getContentStr(): string {
        return this._contentStr;
    }

    async toBase64UrlAsync(): Promise<string> {
        if (this._isText) {
            return Promise.resolve(`data:${this._mime};base64,${btoa(this._contentStr)}`);
        } else {
            return this._contentBlob.stream().getReader().read().then(({ done, value }) => {
                let ui8s: Uint8Array = value || new Uint8Array();
                let biStr: Array<string> = new Array();
                for (let c of ui8s) {
                    biStr.push(String.fromCharCode(c));
                }
                return `data:${this._mime};base64,${btoa(biStr.join(""))}`;
            });
        }
    }

    private detectMime(type: string, url: string): void {
        const urlWithoutQUeryStr = url.split("?")[0];

        if (type === "script") {
            this._mime = "text/javascript";
            this._isText = true;
            return;
        }
        if (type === "stylesheet") {
            this._mime = "text/css";
            this._isText = true;
            return;
        }
        if (type === "imageset") {
            this._mime = "image/svg+xml";
            this._isText = true;
            return;
        }
        if (type === "image") {
            if (urlWithoutQUeryStr.endsWith(".png")) {
                this._mime = "image/png";
                this._isText = false;
                return;
            }
            if (urlWithoutQUeryStr.endsWith(".jpg") || urlWithoutQUeryStr.endsWith(".jpeg")) {
                this._mime = "image/jpeg";
                this._isText = false;
                return;
            }
            if (urlWithoutQUeryStr.endsWith(".svg")) {
                this._mime = "image/svg+xml";
                this._isText = true;
                return;
            }
        }
        this._mime = "unknown";
    }
}
