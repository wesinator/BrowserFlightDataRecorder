const BFDR_VERSION: string = "1.0.0";

let externalResources: Map<string, string> = new Map();
let externalResourcesBlob: Map<string, Blob> = new Map();

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

function getBfdrBody(doc: Document): Promise<string> {
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

    let converters: Array<Promise<void>> = [];

    for (let img of doc.getElementsByTagName("img")) {
        const src = img.src;
        let format = "";
        if (src.endsWith("png")) {
            format = "png";
        } else if (src.endsWith(".jpg") || src.endsWith("jpeg")) {
            format = "jpeg";
        }

        let reader = (externalResourcesBlob.get(src) || new Blob()).stream().getReader();
        let converter = reader.read().then(({ done, value }) => {
            let uInt8Array: Uint8Array = value || new Uint8Array();
            console.log(uInt8Array);
            let i = uInt8Array.length;
            let biStr = [];
            while (i--) { biStr[i] = String.fromCharCode(uInt8Array[i]); }
            img.src = `data:image/${format};base64,${window.btoa(biStr.join(''))}`;
        });
        converters.push(converter);
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

async function downloadHtml(msg: any): Promise<void> {
    const date: Date = new Date(msg.date);
    const url: string = msg.url;
    const doc: Document = new DOMParser().parseFromString(msg.html, "text/html");

    const bfdrContent: string = getBfdrHeader(date, url) + "\n" + await getBfdrBody(doc);

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

    if (details.type === "script" || details.type === "stylesheet") {
        let responseBody = "";

        filter.ondata = event => {
            filter.write(event.data);
            responseBody += decoder.decode(event.data, { stream: true });
        };
        filter.onstop = event => {
            filter.close();
            externalResources.set(details.url, responseBody);
        };
    } else if (details.type === "image") {
        let responseBody = [];

        filter.ondata = event => {
            filter.write(event.data);
            responseBody.push(event.data);
        };
        filter.onstop = event => {
            filter.close();
            externalResourcesBlob.set(details.url, new Blob(responseBody, { type: "image/png" }));
        };
    } else {
        filter.ondata = event => {
            filter.write(event.data);
        }
        filter.onstop = event => {
            filter.close();
        }
    }

}

browser.runtime.onMessage.addListener(msg => {
    if (msg.type === "downloadHtml") {
        downloadHtml(msg);
    }
});

browser.webRequest.onBeforeRequest.addListener(saveExternalResource, { urls: ["*://*/*"] }, ["blocking"]);