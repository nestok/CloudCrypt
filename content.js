if (window.File && window.FileReader && window.FileList && window.Blob) {
    let reH = "https://www.dropbox.com/h";
    let reHome = "https://www.dropbox.com/home";
    let rePersonal = "https://www.dropbox.com/personal";
    let logout = "https://www.dropbox.com/logout";
    let currentHref = document.location.href;
    if (currentHref.match(logout) !== null) {
        chrome.storage.local.set({ encryprionKey: undefined }, function () { });
        chrome.storage.local.set({ oauth2token: undefined }, function () { });
        chrome.storage.local.set({ algorithm: undefined }, function () { });
    }
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
        }

        let previewElements = document.getElementsByClassName('open-button__download');
        for (let i = 0; i < previewElements.length; i++) {
            previewElements[i].addEventListener('click', downloadPreviewClick, false);
        }

        //Btn search input file (don't working)
        //let inelements = document.getElementsByTagName('input');
        //for (let i = 0; i < inelements.length; i++) {
        //    if ((inelements[i].getAttribute("type") == "file")){// && (inelements[i].hasAttribute("multiple")) && (inelements[i].hasAttribute("accept"))) {
        //        let input = inelements[i];
        //        console.log(input);
        //        input.addEventListener("change", function (event) {
        //            console.log(this.files);
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

function downloadPreviewClick(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    let currentHref = document.location.href;
    let path = currentHref.replace("https://www.dropbox.com/home", "");
    path = path.replace("https://www.dropbox.com/personal", "");
    let filepath = path.replace("?preview=", "/");
    downloadFile(filepath, false);
}

function downloadClick(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    //До обновления разметки
    //let fileLink = undefined;
    //if (this.attributes.hasOwnProperty("role")) {
    //    let parent = this.parentNode;
    //    while (!(fileLink = parent.parentNode.getAttribute("href"))) {
    //        parent = parent.parentNode;
    //    }
    //}
    //else {
    //    let downloadFileLine = document.getElementsByClassName('mc-media-row-selected');
    //    fileLink = downloadFileLine[0].parentNode.getAttribute("href");
    //}
    //let index = fileLink.lastIndexOf("?role");
    //let filepath = fileLink.substring(0, fileLink.lastIndexOf("?role")).replace("https://www.dropbox.com/preview", "");



    let filepath = undefined;
    let fileName = undefined;
    let path = getPathToFile();
    if (this.attributes.hasOwnProperty("role")) {
        let parent = this.parentNode;
        while (!(fileName = parent.parentNode.getAttribute("data-filename"))) {
            parent = parent.parentNode;
        }
        filepath = path + '/' + fileName;

        let fileLine = parent.parentNode;
        let noFolderDate = fileLine.getElementsByClassName("mc-media-cell-text mc-media-cell-text-title");
        if (noFolderDate[1].children[0] != undefined)
            downloadFolder(filepath, true);
        else
            downloadFile(filepath, false);
    }
    else {
        let downloadFileLine = document.getElementsByClassName('mc-media-row-selected');
        if (downloadFileLine.length > 1) {
            zipObj = {
                currentFilesCount: 0,
                zip: new JSZip(),
                maxFilesCount: downloadFileLine.length,
                tryToDownloadZip: function () {
                    if (this.currentFilesCount == this.maxFilesCount) {
                        this.zip.generateAsync({ type: "blob" }).then(function (content) {
                            saveAs(content, "Dropbox.zip");
                        });
                        this.currentFilesCount = 0;
                    }
                }
            }
            

            for (let i = 0; i < downloadFileLine.length; i++) {
                fileName = downloadFileLine[i].getAttribute("data-filename");
                filepath = path + '/' + fileName;

                let fileLine = downloadFileLine[i];
                let noFolderDate = fileLine.getElementsByClassName("mc-media-cell-text mc-media-cell-text-title");
                if (noFolderDate[1].children[0] != undefined){
                    zipObj.zip.folder(fileName);
                    zipObj.maxFilesCount--;
                    downloadFolder(filepath, false);
                }
                    
                else
                downloadFile(filepath, true);
            }
        }
        else {
            fileName = downloadFileLine[0].getAttribute("data-filename");
            filepath = path + '/' + fileName;

            let fileLine = downloadFileLine[0];
            let noFolderDate = fileLine.getElementsByClassName("mc-media-cell-text mc-media-cell-text-title");
            if (noFolderDate[1].children[0] != undefined)
                downloadFolder(filepath, true);
            else
                downloadFile(filepath, false);
        }  
    }
}

function downloadFolder(folderpath, isZip) {
    let xhr = new XMLHttpRequest();
    chrome.storage.local.get('oauth2token', function (data) {
        let dropboxToken = data.oauth2token;
        xhr.open('POST', 'https://api.dropboxapi.com/2/files/list_folder');
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function () {
            if (xhr.status === 200) {
                let folderEntry = JSON.parse(xhr.response);
                let files = [];
                let folders = [];

                for (let i = 0; i < folderEntry.entries.length; i++){
                    let file = folderEntry.entries[i];
                    if (file[".tag"] == "file")
                        files.push(file);
                    if (file[".tag"] == "folder")
                        folders.push(file);
                }
                if (isZip) {
                    zipObj = {
                        currentFilesCount: 0,
                        zip: new JSZip(),
                        maxFilesCount: files.length,
                        tryToDownloadZip: function () {
                            if (this.currentFilesCount == this.maxFilesCount) {
                                let folderName = folderpath.replace(/^.*[\\\/]/, '');
                                this.zip.generateAsync({ type: "blob" }).then(function (content) {
                                    saveAs(content, folderName + ".zip");
                                });
                                this.currentFilesCount = 0;
                            }
                        }
                    }
                }
                else
                    zipObj.maxFilesCount += files.length;
                for (let i = 0; i < files.length; i++)
                    downloadFile(folderpath + "/" + files[i].name, true);
                for (let i = 0; i < folders.length; i++)
                    downloadFolder(folderpath + "/" + folders[i].name, false);
            }
            else {
                let msg = 'status:' + xhr.status;
                let errorMessage = xhr.response || 'Unable to get into folder';
                console.log(msg + errorMessage);
            }
        };

        xhr.send(JSON.stringify({
            path: folderpath,
            recursive: false,
            include_media_info: false,
            include_deleted: false,
            include_has_explicit_shared_members: false,
            include_mounted_folders: true
        }));
    });
}

function getPathToFile() {
    let currentHref = document.location.href;
    let path = undefined;
    if (currentHref == "https://www.dropbox.com/h")
        path = "";
    else
        path = currentHref.replace("https://www.dropbox.com/home", "");
    return path;
}

function downloadFile(path, isZip) {
    chrome.storage.local.get('oauth2token', function (data) {
        let dropboxToken = data.oauth2token;
        let xhr = new XMLHttpRequest();
        let runAsync = true;
        xhr.open('POST', 'https://content.dropboxapi.com/2/files/download', runAsync);
        //xhr.responseType = 'arraybuffer';
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({ path: path }));
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    //let array = new Uint8Array(xhr.response);
                    //let pt = CryptoJS.enc.u8array.parse(array);

                    //let decrypted = CryptoJS.AES.decrypt(xhr.response, "AAA");
                    //let decrypted1 = CryptoJS.AES.decrypt(pt, "AAA");
                    //let decrypted2 = CryptoJS.AES.decrypt(array, "AAA");

                    let salt = CryptoJS.enc.Hex.parse(xhr.response.substr(0, 32));
                    let iv = CryptoJS.enc.Hex.parse(xhr.response.substr(32, 32))
                    let encrypted = xhr.response.substring(64);

                    let encKey = undefined;
                    chrome.storage.local.get('encryprionKey', function (data) {
                        encKey = data.encryprionKey;
                        chrome.storage.local.get('algorithm', function (data) {
                            let algorithmName = data.algorithm;
                            let algorithm = undefined;
                            switch (algorithmName) {
                                case "AES":
                                    algorithm = CryptoJS.AES;
                                    break;
                                case "DES":
                                    algorithm = CryptoJS.DES;
                                    break;
                                case "Rabbit":
                                    algorithm = CryptoJS.Rabbit;
                                    break;
                                case "RC4":
                                    algorithm = CryptoJS.RC4;
                                    break;
                                default:
                                    console.log("Error while getting algorythm")
                                    break;
                            }

                            //let decrypted = CryptoJS.AES.decrypt(encrypted, encKey, {
                            let decrypted = algorithm.decrypt(encrypted, encKey, {
                                iv: iv,
                                padding: CryptoJS.pad.Pkcs7,
                                mode: CryptoJS.mode.CBC

                            })
                            let arr = CryptoJS.enc.u8array.stringify(decrypted);
                            let filename = path.replace(/^.*[\\\/]/, '');
                            if (isZip) {
                                zipObj.zip.file(path, arr);
                                zipObj.currentFilesCount++;
                                zipObj.tryToDownloadZip();
                            }
                            else {
                                window.URL = window.URL || window.webkitURL;
                                let blob = new Blob([arr]);//, { type: "application/pdf" });
                                let a = document.createElement('a');

                                a.download = filename;
                                a.href = window.URL.createObjectURL(blob);
                                a.click();
                            }
                        });
                    });
                } else {
                    let msg = 'status:' + xhr.status;
                    console.log(msg + 'Unable to download file');
                }
            }
        };

        xhr.send();
    });
}

function uploadFile(file) {
    let xhr = new XMLHttpRequest();
    let reader = new FileReader();

    reader.onload = function (e) {
        console.log(e.target);
        console.log(e.target.result);

        let array = new Uint8Array(e.target.result);
        let pt = CryptoJS.enc.u8array.parse(array);

        let encKey = undefined;
        chrome.storage.local.get('encryprionKey', function (data) {
            encKey = data.encryprionKey;
            chrome.storage.local.get('algorithm', function (data) {
                let algorithmName = data.algorithm;
                let algorithm = undefined;
                switch (algorithmName) {
                    case "AES":
                        algorithm = CryptoJS.AES;
                        break;
                    case "DES":
                        algorithm = CryptoJS.DES;
                        break;
                    case "Rabbit":
                        algorithm = CryptoJS.Rabbit;
                        break;
                    case "RC4":
                        algorithm = CryptoJS.RC4;
                        break;
                    default:
                        console.log("Error while getting algorythm")
                        break;
                }

                let encrypted = algorithm.encrypt(pt, encKey);
                let arr = CryptoJS.enc.u8array.stringify(encrypted.ciphertext);

                let salt = CryptoJS.lib.WordArray.random(128 / 8);
                let iv = CryptoJS.lib.WordArray.random(128 / 8);
                let encrypted1 = CryptoJS.AES.encrypt(pt, "AAA", {
                    iv: iv,
                    padding: CryptoJS.pad.Pkcs7,
                    mode: CryptoJS.mode.CBC
                });
                let transitmessage = salt.toString() + iv.toString() + encrypted.toString();


                //function toBitArrayCodec(bytes) {
                //    var out = [], i, tmp = 0;
                //    for (i = 0; i < bytes.length; i++) {
                //        tmp = tmp << 8 | bytes[i];
                //        if ((i & 3) === 3) {
                //            out.push(tmp);
                //            tmp = 0;
                //        }
                //    }
                //    if (i & 3) {
                //        out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
                //    }
                //    return out;
                //}

                ///** Convert from a bitArray to an array of bytes. */
                //function fromBitArrayCodec(arr) {
                //    var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
                //    for (i = 0; i < bl / 8; i++) {
                //        if ((i & 3) === 0) {
                //            tmp = arr[i / 4];
                //        }
                //        out.push(tmp >>> 24);
                //        tmp <<= 8;
                //    }
                //    return out;
                //}

                //var bytes = new Uint8Array(e.target.result);
                //var bits = toBitArrayCodec(bytes);
                //var base64bits = sjcl.codec.base64.fromBits(bits); // added
                //var crypt = sjcl.encrypt(encKey, base64bits);

                //var base64decrypt = sjcl.decrypt(encKey, crypt);
                //var decrypt = sjcl.codec.base64.toBits(base64decrypt); // added
                //var byteNumbers = fromBitArrayCodec(decrypt);
                //var byteArray = new Uint8Array(byteNumbers);

                chrome.storage.local.get('oauth2token', function (data) {
                    let dropboxToken = data.oauth2token;
                    xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
                    xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
                    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                    let path = getPathToFile();
                    xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
                        path: path + '/' + file.name,
                        mode: 'add',
                        autorename: true,
                        mute: false
                    }));

                    //xhr.send(crypt);
                    xhr.send(transitmessage);
                });
            });
        });
            
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

isDraggedItemIsFile = function (e, i) {
    if (e.dataTransfer.files.length == 0) {
        return false;
    }
    if (e.dataTransfer.items) {
        if (typeof (e.dataTransfer.items[i].webkitGetAsEntry) == "function") {
            return e.dataTransfer.items[i].webkitGetAsEntry().isFile;
        } else if (typeof (e.dataTransfer.items[i].getAsEntry) == "function") {
            return e.dataTransfer.items[i].getAsEntry().isFile;
        }
    }
    return true;
};

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let files = evt.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
        if (isDraggedItemIsFile(evt, i)) {
            uploadFile(files[i]);
        } else {
            //нельзя использовать из-за отсутствия filesystem доступа
            //console.log(files[i].webkitGetAsEntry());
            let xhr = new XMLHttpRequest();
            chrome.storage.local.get('oauth2token', function (data) {
                let dropboxToken = data.oauth2token;
                xhr.open('POST', 'https://api.dropboxapi.com/2/files/create_folder_v2');
                xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
                xhr.setRequestHeader('Content-Type', 'application/json');
                let path = getPathToFile();
                xhr.send(JSON.stringify({
                    path: path + '/' + files[i].name,
                    autorename: true,
                }));
            });
        }
    }
    
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
} 