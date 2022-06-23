browser.tabs.onCreated.addListener(tab => {
    browser.runtime.onConnect.addListener(port => {
        port.postMessage({ tabId: tab.id });
    });
});
