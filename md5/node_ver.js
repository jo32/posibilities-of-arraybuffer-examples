var fs = require('fs');
var crypto = require('crypto');

console.log(crypto.createHash('md5').update(fs.readFileSync('./test.txt')).digest('hex'));