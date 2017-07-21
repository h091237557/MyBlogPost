var zmq = require('zeromq');
var crypto = require('crypto');
var fromVentilator = zmq.socket('pull');
var toSink = zmq.socket('push');

fromVentilator.connect('tcp://127.0.0.1:5000');
toSink.connect('tcp://127.0.0.1:5001');
console.log('Worker connect to 5001');

fromVentilator.on('message',function (buffer) {
    var msg = JSON.parse(buffer);
    var variations = msg.variations;
    variations.forEach(function(word) {
        console.log(`Processing: ${word}`);    
        var shasum = crypto.createHash('sha1');
        shasum.update(word);
        var digest = shasum.digest('hex');
        if(digest === msg.searchHash){
            console.log(`Found! => ${word}`);
            toSink.send(`Found! ${digest} => ${word}`);
        }
    });
})