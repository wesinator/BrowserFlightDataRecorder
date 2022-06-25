document.addEventListener("DOMContentLoaded", event => {
    let downloadHtmlOnBeforeUnload: HTMLInputElement = document.querySelector("#downloadHtmlOnBeforeUnload");
    let captureHttpCommunication: HTMLInputElement = document.querySelector("#captureHttpCommunication");

    browser.storage.local.get(["downloadHtmlOnBeforeUnload", "captureHttpCommunication"])
        .then(data => {
            if (data["downloadHtmlOnBeforeUnload"] === true) {
                downloadHtmlOnBeforeUnload.checked = true;
            } else {
                downloadHtmlOnBeforeUnload.checked = false;
            }
            if (data["captureHttpCommunication"] === true) {
                captureHttpCommunication.checked = true;
            } else {
                captureHttpCommunication.checked = false;
            }
        });

    downloadHtmlOnBeforeUnload.addEventListener("change", event => {
        browser.storage.local.set({ "downloadHtmlOnBeforeUnload": downloadHtmlOnBeforeUnload.checked });
    });

    captureHttpCommunication.addEventListener("change", event => {
        browser.storage.local.set({ "captureHttpCommunication": captureHttpCommunication.checked });
    });
});
