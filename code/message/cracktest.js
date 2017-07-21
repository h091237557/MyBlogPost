var crypto = require('crypto');

var word = "mark";
var shasum  = crypto.createHash('sha1');
console.log(shasum);
shasum.update(word);
console.log(shasum);
var digest = shasum.digest('hex');

console.log(digest);