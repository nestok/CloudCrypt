chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.debugger.attach({tabId:tab.id}, version,
      onAttach.bind(null, tab.id));
});
alert(chrome.fileSystem);
chrome.fileSystem.getDisplayPath(files[0], function (path) {
    alert(chrome.fileSystem);
});

var version = "1.0";

function onAttach(tabId) {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  chrome.windows.create(
      {url: "headers.html?" + tabId, type: "popup", width: 800, height: 600});
}
