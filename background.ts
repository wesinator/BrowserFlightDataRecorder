const BFDR_VERSION: string = "1.0.0";

let externalResources: Map<string, string> = new Map();

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

function getBfdrBody(doc: Document, originalUrl: string): string {
    for (let script of doc.getElementsByTagName("script")) {
        const src = script.src;
        if (src === "") {
            continue;
        }
        script.innerHTML = externalResources.get(src) || "BFDR-SCRIPT-NOT-FOUND";
        script.setAttribute("bfdr-src", src);
        script.removeAttribute("src");
    }

    for (let stylesheet of doc.getElementsByTagName("link")) {
        if (stylesheet.rel === "stylesheet" || stylesheet.getAttribute("href")?.endsWith(".css")) {
            const href = stylesheet.href;
            let style: HTMLStyleElement = doc.createElement("style");
            style.setAttribute("bfdr-href", href);
            style.innerHTML = externalResources.get(href) || "BFDR-STYLESHEET-NOT-FOUND";
            doc.documentElement.appendChild(style);
        }
    }

    return doc.documentElement.outerHTML;
}


function downloadHtml(msg: any): void {
    const date: Date = new Date(msg.date);
    const url: string = msg.url;
    const doc: Document = new DOMParser().parseFromString(msg.html, "text/html");

    const bfdrContent: string = getBfdrHeader(date, url) + "\n" + getBfdrBody(doc, url);

    const blob = new Blob([bfdrContent], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    browser.downloads.download({
        url: downloadUrl,
        filename: `BFDR-${formatDate(date)}.html`,
    });
}


function saveExternalResource(details): void {

    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder();
    let encoder = new TextEncoder();

    let responseBody = "";

    filter.ondata = event => {
        filter.write(event.data);
        responseBody += decoder.decode(event.data, { stream: true });
    };
    filter.onstop = event => {
        filter.close();
        externalResources.set(details.url, responseBody);
    };
}

browser.runtime.onMessage.addListener(msg => {
    if (msg.type === "downloadHtml") {
        downloadHtml(msg);
    }
});

browser.webRequest.onBeforeRequest.addListener(saveExternalResource, { urls: ["*://*/*"] }, ["blocking"]);