var murmurhash3 = require('non-crypto-hash').createHash('murmurhash3');

var mimeHashDict = ['image/png', 'text/plain', 'text/css', 'image/jpeg', 'application/javascript'].reduce(function(sum, val) {
    sum[murmurhash3.x86Hash32(val)] = val;
    return sum;
}, {})


var input = document.getElementById('files');
var submitButton = document.getElementById('submit');

function ajaxAsArrayBuffer(url) {
    return new Promise(function(resolve, reject) {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";
        oReq.onload = function(oEvent) {
            return resolve(oReq.response);
        }
        oReq.send();
    });
}

function getBlobs(buffer) {
    var dataView = new DataView(buffer);
    var listLength = dataView.getUint32(12);
    var blobs = {};
    for (var i = 0; i < listLength; i++) {
        var offset = 0x10 + 0x10 * i;
        var fileOffset = dataView.getUint32(offset);
        var fileSize = dataView.getUint32(offset + 4);
        var mimeHash = dataView.getUint32(offset + 8).toString(16);
        var filenameHash = dataView.getUint32(offset + 12).toString(16);
        var fileBuffer = buffer.slice(fileOffset, fileOffset + fileSize);
        var type = (mimeHashDict[mimeHash] != undefined) ? mimeHashDict[mimeHash] : 'application/octet-binary';
        blobs[filenameHash] = new Blob([fileBuffer], {
            type: type
        });
    }
    return blobs;
}

submitButton.addEventListener('click', function(e) {
    var files = input.value.split(',');
    var url = '/sprite?' + files.map(function(val) {
        return "file=" + val;
    }).join('&');
    ajaxAsArrayBuffer(url).then(function(buffer) {
        var blobs = getBlobs(buffer);
        files.forEach(function(val) {
            var wrapper= document.createElement('div');
            var hash = murmurhash3.x86Hash32(val);
            wrapper.innerHTML= val + ": <img src='" + URL.createObjectURL(blobs[hash]) + "' />";
            document.body.appendChild(wrapper);
        });
    }).catch(function(err) {
        return alert(err);
    })
});