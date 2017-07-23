var zmq = require('zeromq');

var responder = zmq.socket('rep');

responder.on('message', function (request) {
    console.log(`Received request : ${request.toString()}`);

    setTimeout(function () {
       responder.send("Ok ~ I Received your msg"); 
    },1000);
})

responder.bind('tcp://127.0.0.1:5555', function (err) {
    if(err){
        console.log(err);
    }else{
        console.log('Listening on 5555');
    }
})

process.on('SIGINT', function () {
    responder.close();
    
})