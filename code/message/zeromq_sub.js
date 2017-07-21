var zmq = require('zeromq');

var subSocket = zmq.socket('sub');
var port = "3000";

subSocket.connect(`tcp://127.0.0.1:${port}`);
subSocket.subscribe('mark');
console.log(`Subscriber connected to port ${port}`);

subSocket.on('message', function(topic, message){
    console.log(topic.toString());
    console.log(message.toString());
})

setInterval(function(){
    throw new Error('error');
},10000)