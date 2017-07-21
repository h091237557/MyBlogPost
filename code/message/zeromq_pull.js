var zmq = require('zeromq');
var pullSocket = zmq.socket('pull');

pullSocket.connect('tcp://127.0.0.1:3000');
console.log('Worker connected to port 3000');

pullSocket.on('message',function(msg){
    console.log(msg.toString());
})