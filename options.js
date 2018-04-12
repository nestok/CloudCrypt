document.addEventListener('DOMContentLoaded', function () {
    if ((localStorage["encryprionKey"] !== null) && (localStorage["encryprionKey"] !== undefined)) {
        document.getElementById("keyInput").value = localStorage["encryprionKey"];
    }

    enableCrypt.addEventListener('click', function () {
        let key = document.getElementById("keyInput").value;
        if (key.length == 0)
            return alert("Enter the key");
        if (key.length < 5)
            return alert("Too easy key");
        chrome.storage.local.set({ encryprionKey: key }, function () {
            alert("Key successfully saved!");
        });

        //localStorage["encryprionKey"] = document.getElementById("keyInput").value;
        //alert("Key successfully saved!");
    }, false);
}, false);