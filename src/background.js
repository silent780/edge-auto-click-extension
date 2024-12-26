// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Edge Auto Click Extension Installed");
});

chrome.browserAction.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "clickElement" });
});