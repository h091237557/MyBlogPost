var zmq = require('zeromq');
var variationsStream = require('variations-stream');
var alphabet = 'abcdefghijklmnopqrstuvwxyz';
var batchSize = 10000;
var maxLength = process.argv[2];
var searchHash = process.argv[3];

var ventilator = zmq.socket('push');
ventilator.bindSync('tcp://127.0.0.1:5000');

var batch = [];
variationsStream(alphabet, maxLength)
    .on('data', function (combination) {
        console.log(combination);
        batch.push(combination);
        if (batch.length === batchSize) {
            var msg = {
                searchHash: searchHash,
                variations: batch,
            }
            
            ventilator.send(JSON.stringify(msg));
            batch = [];
        }
    }).on('end', function () {
        var msg = {
            searchHash: searchHash,
            variations: batch,
        }
        ventilator.send(JSON.stringify(msg));
    });