chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.debugger.attach({tabId:tab.id}, version,
      onAttach.bind(null, tab.id));
});

//chrome.downloads.onChanged.addListener(function (detail) {
//    if (detail.state.current == "complete") {
//        let downloadId = detail.id;
//        try {
//            chrome.downloads.search({ id: downloadId, limit: 1 }, function (file) {

//                let xhr = new XMLHttpRequest();

//                xhr.onreadystatechange = function () {
//                    if (this.readyState == 4) {
//                        file.blobData = this.response;
//                        alert(this.response);
//                    }
//                }
//                xhr.open('GET', "file://" + file.filename);
//                xhr.send();
//            });
//        }
//        catch (err)
//        {
//            alert(err);
//        }
//    }
//});

var version = "1.0";

function onAttach(tabId) {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  chrome.windows.create(
      {url: "headers.html?" + tabId, type: "popup", width: 800, height: 600});
}
