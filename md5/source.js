var crypto = require('crypto');

var fs = document.getElementById('fs');
var md5Dom = document.getElementById('md5');

function readAsArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        var fr = new FileReader();
        fr.onload = function(e) {
            return resolve(e.target.result);
        }

        fr.onerror = function(e) {
            return reject(e);
        }

        fr.readAsArrayBuffer(file);
    });
}

fs.addEventListener('change', function handleFileChange(e) {
    readAsArrayBuffer(e.target.files[0]).then(function(buffer) {
        var sum = crypto.createHash('md5');
        sum.update(buffer);
        md5Dom.innerText = sum.digest('hex');
    });
});



