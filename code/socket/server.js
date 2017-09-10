
var net = require('net');

var HOST = '127.0.0.1';
var PORT = '61111';


net.createServer(function(sock){
    console.log('Server open !');

    sock.on('data',function(data){
        console.log('I receved data from client :' + data);
    });

    sock.on('close',function(){
        console.log('close');
    });
}).listen(PORT, HOST);
