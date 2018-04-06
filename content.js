﻿if (window.File && window.FileReader && window.FileList && window.Blob) {
    let reH = "https://www.dropbox.com/h";
    let reHome = "https://www.dropbox.com/home";
    let rePersonal = "https://www.dropbox.com/personal";
    let currentHref = document.location.href;
    if ((currentHref.match(reH) !== null) || (currentHref.match(reHome) !== null) || (currentHref.match(rePersonal) !== null)) {
        let elem = document.body;
        elem.addEventListener('dragover', handleDragOver, false);
        elem.addEventListener('drop', handleFileSelect, false);
        elem.onload = enableEvents();
    }
} else {
    alert('The File APIs are not fully supported in this browser.');
}

function enableEvents() {
    document.addEventListener("mousedown", function () {
        let elements = document.getElementsByClassName('action-download');

        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('click', downloadClick, false);
            console.log(elements[i]);
        }

        //Btn search input file (don't working)
        //let elements = document.getElementsByTagName('input');
        //for (let i = 0; i < elements.length; i++) {
        //    if ((elements[i].getAttribute("type") == "file") && (elements[i].hasAttribute("multiple")) && (elements[i].hasAttribute("accept"))) {
        //        let input = elements[i];
        //        console.log(input);
        //        input.addEventListener("change", function (event) {
        //            console.log(input);

        //            let files = event.target.files;
        //            let i = 0, len = files.length;

        //            for (; i < len; i++) {
        //                console.log("Filename: " + files[i].name);
        //                console.log("Type: " + files[i].type);
        //                console.log("Size: " + files[i].size + " bytes");
        //            }
        //        }, false);
        //    }
        //}

    }, false);
}



function downloadClick(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let fileLink = undefined;
    if (this.attributes.hasOwnProperty("role")) {
        let parent = this.parentNode;
        while (!(fileLink = parent.parentNode.getAttribute("href"))) {
            parent = parent.parentNode;
        }
    }
    else {
        let downloadFileLine = document.getElementsByClassName('mc-media-row-selected');
        fileLink = downloadFileLine[0].parentNode.getAttribute("href");
    }
    let index = fileLink.lastIndexOf("?role");
    let filepath = fileLink.substring(0, fileLink.lastIndexOf("?role")).replace("https://www.dropbox.com/preview", "");
    downloadFile(filepath);
}

function downloadFile(path) {
    let dropboxToken = "ngn5QWkYQ6AAAAAAAAAAFyI3UQqj8c3vdIQSAJrtVA9UAds_agDsqiRh4c5wJF6a";

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (xhr.status == 200) {
                //let array = new Uint8Array(xhr.response);
                //let pt = CryptoJS.enc.u8array.parse(array);

                //let decrypted = CryptoJS.AES.decrypt(xhr.response, "AAA");
                //let decrypted1 = CryptoJS.AES.decrypt(pt, "AAA");
                //let decrypted2 = CryptoJS.AES.decrypt(array, "AAA");

                var salt = CryptoJS.enc.Hex.parse(xhr.response.substr(0, 32));
                var iv = CryptoJS.enc.Hex.parse(xhr.response.substr(32, 32))
                var encrypted = xhr.response.substring(64);

                var decrypted = CryptoJS.AES.decrypt(encrypted, "AAA", {
                    iv: iv,
                    padding: CryptoJS.pad.Pkcs7,
                    mode: CryptoJS.mode.CBC

                })
                let arr = CryptoJS.enc.u8array.stringify(decrypted);

                window.URL = window.URL || window.webkitURL;
                let blob = new Blob([arr]);//, { type: "application/pdf" });
                let a = document.createElement('a');
                let filename = path.replace(/^.*[\\\/]/, '')
                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.click();

            } else {
                let msg = 'status:' + xhr.status;
                console.log(msg + 'Unable to download file');
            }
        }
    };

    let runAsync = true ; 
    xhr.open('POST', 'https://content.dropboxapi.com/2/files/download', runAsync);
    //xhr.responseType = 'arraybuffer';
    xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
    xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({ path: path }));
    xhr.send();
}

function uploadFile(file) {
    let xhr = new XMLHttpRequest();
    let reader = new FileReader();

    reader.onload = function (e) {
        console.log(e.target);
        console.log(e.target.result);

        let array = new Uint8Array(e.target.result);
        let pt = CryptoJS.enc.u8array.parse(array);
        let encrypted = CryptoJS.AES.encrypt(pt, "AAA");
        let arr = CryptoJS.enc.u8array.stringify(encrypted.ciphertext);

        let salt = CryptoJS.lib.WordArray.random(128 / 8);
        let iv = CryptoJS.lib.WordArray.random(128 / 8);
        let encrypted1 = CryptoJS.AES.encrypt(pt, "AAA", {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        let transitmessage = salt.toString() + iv.toString() + encrypted.toString();

        //let decrypted = CryptoJS.AES.decrypt(encrypted, "AAA");
        //let arr = CryptoJS.enc.u8array.stringify(decrypted);


        let dropboxToken = "ngn5QWkYQ6AAAAAAAAAAFyI3UQqj8c3vdIQSAJrtVA9UAds_agDsqiRh4c5wJF6a";
        xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
            path: '/' + file.name,
            mode: 'add',
            autorename: true,
            mute: false
        }));

        //xhr.send(arr);
        xhr.send(transitmessage);
    }
    reader.readAsArrayBuffer(file);

    xhr.upload.onprogress = function (evt) {
        let percentComplete = parseInt(100.0 * evt.loaded / evt.total);
        // Upload in progress. Do something here with the percent complete.
    };

    xhr.onload = function () {
        if (xhr.status === 200) {
            let fileInfo = JSON.parse(xhr.response);
            // Upload succeeded. Do something here with the file info.
        }
        else {
            let msg = 'status:' + xhr.status;
            let errorMessage = xhr.response || 'Unable to upload file';
            console.log(msg + errorMessage);
        }
    };
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let files = evt.dataTransfer.files;
    
    for (let i in files) {
        uploadFile(files[i]);
    }
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
} 