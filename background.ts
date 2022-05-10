const BFDR_VERSION: string = "1.0.0";


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

function getBfdrBody(doc: Document): string {
    return doc.documentElement.outerHTML;
}


function downloadHtml(msg: any): void {
    const date: Date = new Date(msg.date);
    const url: string = msg.url;
    const doc: Document = new DOMParser().parseFromString(msg.html, "text/html");

    const bfdrContent: string = getBfdrHeader(date, url) + "\n" + getBfdrBody(doc);

    const blob = new Blob([bfdrContent], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    browser.downloads.download({
        url: downloadUrl,
        filename: `BFDR-${formatDate(date)}.html`,
    });
}


function saveHttpResponse(msg: any): void {

}


browser.runtime.onMessage.addListener(msg => {
    if (msg.type === "downloadHtml") {
        downloadHtml(msg);
    } else if (msg.type === "saveHttpResponse") {
        saveHttpResponse(msg);
    }
});