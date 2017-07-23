var zmq =  require('zeromq');
var requester = zmq.socket('req');

requester.on('message', function (response) {
    console.log(`Received response: ${response.toString()}`)
})

console.log('Send msg');
requester.send('Hello Mark');


requester.connect('tcp://localhost:5555');

process.on('SIGINT', function () {
    requester.close();
})

