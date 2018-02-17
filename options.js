document.addEventListener('DOMContentLoaded', function () {
    enableCrypt.addEventListener('click', function () {
        let key = document.getElementById("keyInput").value;
        if (key.length < 5)
            return alert("Too easy Keyword");
        localStorage["encryprionKey"] = document.getElementById("keyInput").value;
        alert("Your encryprion key" + localStorage["encryprionKey"]);
    });

    
    //"default_popup": "popup.html"




    //alert(xhr);
    //var req = new XMLHttpRequest();
    //req.open('GET', document.location, false);
    //req.send(null);
    //var headers = req.getAllResponseHeaders().toLowerCase();
    //alert(headers);

    //xhr = new XMLHttpRequest();
    //xhr.onreadystatechange = function () {
    //    alert(2);
    //    if (xhr.readyState == 4) {
    //        if (xhr.responseText) {
    //            var xmlDoc = xhr.responseText;

    //            var imgs = xmlDoc.match(/http:\/\/imgsrc.hubblesite.org\/hu\/db\/images\/hs-[0-9]{4}-[0-9]{2}-[a-z]/g);
    //            var hrefs = xmlDoc.match(/gallery\/wallpaper\/pr[0-9]{4,}[a-z]/g);
    //            alert(imgs);
    //            alert(hrefs);
    //        }
    //    }
    //}
});