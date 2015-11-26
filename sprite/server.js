var fs = require('fs');
var nch = require('non-crypto-hash');
var murmurhash3 = nch.createHash('murmurhash3');
var mime = require('mime');
var express = require('express');
var app = express();

function get32BitHexBuffer(inputString) {
    var hex = murmurhash3.x86Hash32(inputString);
    return new Buffer(hex, 'hex');
}

function readFilePromise(filePath) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filePath, function(err, buffer) {
            if (err) {
                return reject(err);
            }
            return resolve(buffer);
        });
    });
}

function getAllFilesBuffer(fileArray) {
    return Promise.all(fileArray.map(function(filePath) {
        return readFilePromise(filePath);
    }));
}

function getConcatedBuffer(fileArray) {
    var offset = 0;
    var fileOffset = 0;
    var preConcatedBuffers = [];
    var tempBuffer = null;
    return getAllFilesBuffer(fileArray).then(function(buffers) {
        var fileOffset = 16 + 16 * fileArray.length;
        var totalByteLength = fileOffset + buffers.reduce(function(sum, val) {
            return sum + val.byteLength;
        }, 0);
        preConcatedBuffers.push(new Buffer('DEMOONLY'));
        tempBuffer = new Buffer(4);
        tempBuffer.writeInt32BE(0x0010, 0);
        preConcatedBuffers.push(tempBuffer);
        tempBuffer = new Buffer(4);
        tempBuffer.writeInt32BE(fileArray.length, 0);
        preConcatedBuffers.push(tempBuffer);
        var tempFileOffset = fileOffset;
        fileArray.forEach(function(val, index) {
            tempBuffer = new Buffer(4);
            tempBuffer.writeInt32BE(tempFileOffset, 0);
            preConcatedBuffers.push(tempBuffer);
            var fileLength = buffers[index].byteLength;
            tempBuffer = new Buffer(4);
            tempBuffer.writeInt32BE(fileLength, 0);
            preConcatedBuffers.push(tempBuffer);
            preConcatedBuffers.push(get32BitHexBuffer(mime.lookup(val)));
            preConcatedBuffers.push(get32BitHexBuffer(val));
            tempFileOffset += fileLength;
        });
        buffers.forEach(function(buffer, index) {
            preConcatedBuffers.push(buffer);
        });
        return Buffer.concat(preConcatedBuffers);
    });
}

app.use(express.static('.'));

app.get('/sprite', function(req, res, next) {

    var files = req.query.file;
    files = [].concat(files);
    if (!files.length) {
        return next(new Error('file parameter is empty'));
    }

    getConcatedBuffer(files).then(function(buffer) {
        res.type('application/octet-stream').send(buffer);
        return next();
    }).catch(function(err) {
        return next(err);
    });
});

app.use(function(err, req, res, next) {
    if (err) {
        res.status(err.status || 500).json({
            status: err.status || 500,
            msg: err.message
        });
    }
    return next(err);
});

var server = app.listen(8081, '0.0.0.0', function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});