function sendPageInfo(): void {

    for (let input of document.getElementsByTagName("input")) {
        input.setAttribute("value", input.value);
    }

    for (let script of document.getElementsByTagName("script")) {
        if (script.hasAttribute("src")) {
            script.setAttribute("src", script.src);
        }
    }

    for (let link of document.getElementsByTagName("link")) {
        if (link.rel === "stylesheet") {
            link.setAttribute("href", link.href);
        }
    }

    for (let img of document.getElementsByTagName("img")) {
        img.setAttribute("src", img.src);
    }

    browser.runtime.sendMessage({
        type: "downloadHtml",
        date: new Date().toISOString(),
        url: location.href,
        html: document.documentElement.outerHTML,
    });
}

addEventListener("beforeunload", event => { sendPageInfo(); });
