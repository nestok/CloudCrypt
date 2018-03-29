﻿if (window.File && window.FileReader && window.FileList && window.Blob) {
  
    let elem = document.getElementById("embedded-app");
    elem.addEventListener('dragover', handleDragOver, false);
    elem.addEventListener('drop', handleFileSelect, false);

    let re = "https://www.dropbox.com/";
    if (document.location.href.match(re) !== null) {
        document.addEventListener("click", function () {

            //найти кнопки по классу, добраться до row их родителей, выбрать роу id, и заходить в дропбокс и брать файл или просто брать название файла и скачивать файл с таким названием
            let elements = document.getElementsByClassName('action-download');
            for (let i = 0; i < elements.length; i++) {
                console.log(elements[i]);
            }
            
            let path = "/" + "3.docx";
            //let path = "/" + "1.docx";
            let dropboxToken = "ngn5QWkYQ6AAAAAAAAAAFyI3UQqj8c3vdIQSAJrtVA9UAds_agDsqiRh4c5wJF6a";

            let xhr = new XMLHttpRequest( ) ;                                              
            xhr.onreadystatechange = function( )                                           
            {                                                                               
                if ( xhr.readyState == XMLHttpRequest.DONE)                                  
                {                                                                             
                    if (xhr.status == 200)                                                     
                    {
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
                        a.download = "3.docx";
                        a.href = window.URL.createObjectURL(blob);
                        a.click();

                    } else                                                                      
                    {                                                                           
                        let msg = 'status:' + xhr.status;
                        console.log(msg + 'Unable to download file');                                                      
                    }                                                                           
                }                                                                             
            } ;                                                                             
 
            let runAsync = true ; 
            xhr.open('POST', 'https://content.dropboxapi.com/2/files/download', runAsync);
            //xhr.responseType = 'arraybuffer';
            xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
            xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({ path: path })) ;     
            xhr.send();


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

} else {
    alert('The File APIs are not fully supported in this browser.');
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let files = evt.dataTransfer.files; // FileList object.
    let file = files[0];
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

    // files is a FileList of File objects. List some properties.
    let output = [];

    for (let i = 0, f; f = files[i]; i++) {
        output.push(escape(f.name), f.type, f.size, f.lastModifiedDate.toLocaleDateString());
        console.log(files.item(0));
    }
    console.log(output);



    var xhr = new XMLHttpRequest();
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

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
} 