var zmq = require('zeromq');
var sockPush = zmq.socket('push');

sockPush.bindSync('tcp://127.0.0.1:3000');
console.log('Producer bound to port 3000');

var i =0;
setInterval(function(){
    sockPush.send(`mark wake up ~ : ${i}`);
    i++;
},1000);