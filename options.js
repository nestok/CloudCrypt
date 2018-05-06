document.addEventListener('DOMContentLoaded', function () {
    if ((localStorage["encryprionKey"] !== null) && (localStorage["encryprionKey"] !== undefined)) {
        document.getElementById("keyInput").value = localStorage["encryprionKey"];
    }

    enableCrypt.addEventListener('click', function () {
        let key = document.getElementById("keyInput").value;
        let tokenCode = document.getElementById("codeInput").value;
        if (key.length == 0)
            return alert("Enter the key");
        if (key.length < 5)
            return alert("Too easy key");
        console.log(tokenCode.length);
        getAccessToken(tokenCode, key);
    }, false);
}, false);

function getAccessToken(tokenCode, key) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.dropboxapi.com/oauth2/token');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    let details = {
        'code': tokenCode,
        'grant_type': 'authorization_code',
        'client_id': '0rc5mtk4tias544',
        'client_secret': '6gos8voaa7hzzgx'
    };
    let formBody = [];
    for (let property in details) {
        let encodedKey = encodeURIComponent(property);
        let encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    xhr.onload = function () {
        if (xhr.status === 200) {
            let oauthUserInfo = JSON.parse(xhr.response);
            saveCurrentUserSettings(oauthUserInfo.access_token, key);
        }
        else {
            let msg = 'status:' + xhr.status;
            let errorMessage = xhr.response || 'Unable to oauth';
            console.log(msg + errorMessage);
        }
    };

    xhr.send(formBody);
}

function saveCurrentUserSettings(oauthToken, key) {
    let hashKey = key.hashCode();
    

    chrome.storage.local.set({ encryprionKey: key }, function () {
        alert("Key successfully saved!");
    });
    chrome.storage.local.set({ oauth2token: oauthToken }, function () {
        alert("Token successfully saved!");
    });
}

//String.prototype.hashCode = function () {
//    var hash = 0;
//    if (this.length == 0) return hash;
//    for (i = 0; i < this.length; i++) {
//        char = this.charCodeAt(i);
//        hash = ((hash << 5) - hash) + char;
//        hash = hash & hash; // Convert to 32bit integer
//    }
//    return hash;
//}