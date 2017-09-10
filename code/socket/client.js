var net = require('net');

var HOST = '127.0.0.1';
var PORT = '61111';

var client = net.Socket();
client.connect(PORT, HOST, function(){
    console.log('client connected');

    setInterval(function(){
        client.write('I am Mark');
    },1000)
});

client.on('close', function(){
    console.log('close client');
});
