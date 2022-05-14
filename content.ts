function sendPageInfo(): void {

    for (let input of document.getElementsByTagName("input")) {
        input.setAttribute("value", input.value);
    }

    for (let script of document.getElementsByTagName("script")) {
        script.setAttribute("src", script.src);
    }

    for (let link of document.getElementsByTagName("link")) {
        if (link.rel === "stylesheet" || link.href.endsWith(".css")) {
            link.setAttribute("href", link.href);
        }
        if (link.getAttribute("data-href")?.endsWith(".css")) {
            let dataHref = link.getAttribute("data-href");
            if (dataHref?.startsWith("https://") || dataHref?.startsWith("http://")) {
                link.setAttribute("href", dataHref);
            } else {
                if (dataHref?.charAt(0) === "/") {
                    dataHref = dataHref.substring(1);
                }

                if (document.baseURI.endsWith("/")) {
                    link.setAttribute("href", document.baseURI + dataHref);
                } else {
                    link.setAttribute("href", document.baseURI + "/" + dataHref);
                }
            }
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

addEventListener('beforeunload', event => { sendPageInfo(); });
addEventListener('dblclick', event => { sendPageInfo(); });