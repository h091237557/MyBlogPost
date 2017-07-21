var zmq = require('zeromq');
var pubSocket = zmq.socket('pub');

pubSocket.bindSync('tcp://127.0.0.1:3000');
console.log('Publisher bound to port 3000');

setInterval(function(){
    pubSocket.send(['mark',new Date()]);
},1000);