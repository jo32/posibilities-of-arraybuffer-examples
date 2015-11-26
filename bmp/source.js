var fs = document.getElementById('fs');

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

function editBmp(buffer) {
    var uint8View = new Uint8Array(buffer);
    // 获取 pixel array 的起始位置，小端转化为大端
    var pixelArrayOffset = 0;
    for (var i = 0x0D; i >= 0x0A; i--) {
        pixelArrayOffset <<= 8;
        pixelArrayOffset += uint8View[i];
    }
    // 将图片的最后一行弄成红色，颜色的存储也是按照小端存储
    var firstLineOffset = 9 * 32 + pixelArrayOffset;
    for (var i = firstLineOffset; i < firstLineOffset + 32; i++) {
        if ((i - firstLineOffset) % 3 == 2) {
            uint8View[i] = 0xFF;
        } else {
            uint8View[i] = 0x00;
        }
    }
    return buffer;
}

fs.addEventListener('change', function handleFileChange(e) {
    // 以 buffer 形式读取文件内容
    readAsArrayBuffer(e.target.files[0]).then(function(buffer) {
        // 展示未修改前的 BMP 文件内容
        var blob = new Blob([buffer], {
            type: 'image/bmp'
        });
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.src = url;
        document.body.appendChild(img);
        // 修改文件内容
        buffer = editBmp(buffer);
        // 展示未修改后的 BMP 文件内容
        var blob = new Blob([buffer], {
            type: 'image/bmp'
        });
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.src = url;
        document.body.appendChild(img);
    });
});