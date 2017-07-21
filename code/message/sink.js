var zmq = require('zeromq');
var sink = zmq.socket('pull');
sink.bindSync('tcp://127.0.0.1:5001');

sink.on('message',function (buffer) {
    console.log(`Message from worker: ${buffer.toString()}`);
})