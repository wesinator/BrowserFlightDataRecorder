function sendPageInfo(): void {

    let inputs: HTMLCollectionOf<HTMLInputElement> = document.getElementsByTagName("input");
    for (let i: number = 0; i < inputs.length; i++) {
        inputs[i].setAttribute("value", inputs[i].value);
    }

    browser.runtime.sendMessage({
        type: "downloadHtml",
        date: new Date().toISOString(),
        url: location.href,
        html: document.documentElement.outerHTML,
    });
}

addEventListener('beforeunload', event => { sendPageInfo(); });
