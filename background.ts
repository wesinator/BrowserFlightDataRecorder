const BFDR_VERSION: string = "1.3.0";


let externalResources: Map<string, ExternalResource> = new Map();;

function formatDate(date: Date): string {
    function zeroPadding(num: Number): string {
        if (num <= 9) {
            return `0${num}`;
        } else {
            return `${num}`;
        }
    }
    return `${date.getFullYear()}${zeroPadding(date.getMonth())}${zeroPadding(date.getDate())}${zeroPadding(date.getHours())}${zeroPadding(date.getMinutes())}${zeroPadding(date.getSeconds())}`;
}

function getBfdrHeader(date: Date, url: string): string {
    let bfdrHeader: string = "";
    bfdrHeader += "BrowserFlightDataRecorder\n";
    bfdrHeader += `version:${BFDR_VERSION}\n`;
    bfdrHeader += `date:${formatDate(date)}\n`;
    bfdrHeader += `url:${url}\n`;

    return bfdrHeader;
}

async function getBfdrBodyAsync(doc: Document): Promise<string> {
    for (let script of doc.getElementsByTagName("script")) {
        if (!script.hasAttribute("src")) {
            continue;
        }
        const src = script.src;
        if (src === "") {
            continue;
        }
        script.innerHTML = externalResources.get(src)?.getContentStr() || "BFDR-SCRIPT-NOT-FOUND";
        script.setAttribute("bfdr-src", src);
        script.removeAttribute("src");
    }

    for (let link of doc.getElementsByTagName("link")) {
        if (link.rel === "stylesheet") {
            const href = link.href;
            if (href === "") {
                continue;
            }
            let style: HTMLStyleElement = doc.createElement("style");
            style.setAttribute("bfdr-href", href);
            style.innerHTML = externalResources.get(href)?.getContentStr() || "BFDR-STYLESHEET-NOT-FOUND";
            doc.documentElement.appendChild(style);

            link.removeAttribute("href");
        }
    }

    let converters: Array<Promise<void>> = [];
    for (let img of doc.getElementsByTagName("img")) {
        const src = img.src;
        converters.push(Promise.resolve(await externalResources.get(src)?.toBase64UrlAsync() || "BFDR-IMAGE-NOT-FOUND").then(value => {
            img.src = value;
        }));
    }

    return Promise.all(converters).then(values => {
        return doc.documentElement.outerHTML;
    });
}

function getDomainFromUrl(url: string): string {
    if (url.startsWith("https://")) {
        url = url.substring("https://".length);
    } else if (url.startsWith("http://")) {
        url = url.substring("http://".length);
    }
    return url.split("/")[0];
}

async function downloadAsHtml(msg: any): Promise<void> {
    const date: Date = new Date(msg.date);
    const url: string = msg.url;
    const doc: Document = new DOMParser().parseFromString(msg.html, "text/html");

    const bfdrContent: string = getBfdrHeader(date, url) + "\n" + await getBfdrBodyAsync(doc);

    const blob = new Blob([bfdrContent], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    browser.downloads.download({
        url: downloadUrl,
        filename: `BFDR-${formatDate(date)}.${getDomainFromUrl(url)}.html`,
    });
}

function saveExternalResource(details): void {
    let filter = browser.webRequest.filterResponseData(details.requestId);

    let decoder = new TextDecoder();
    let responseBodyStr = "";
    let responseBodyBlob: Array<ArrayBuffer> = new Array();

    filter.ondata = event => {
        filter.write(event.data);
        responseBodyStr += decoder.decode(event.data, { stream: true });
        responseBodyBlob.push(event.data);
    };
    filter.onstop = event => {
        filter.close();
        externalResources.set(details.url, new ExternalResource(responseBodyStr, responseBodyBlob, details.type, details.url));
    };
}

browser.runtime.onMessage.addListener(msg => {
    if (msg.type === "downloadHtml") {
        downloadAsHtml(msg);
    }
});

browser.webRequest.onBeforeRequest.addListener(saveExternalResource, { urls: ["*://*/*"] }, ["blocking"]);
