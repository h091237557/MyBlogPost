var amqp = require('amqplib/callback_api');

amqp.connect('amqp://127.0.0.1', function (err, conn) {
    conn.createChannel(function (err, ch) {
        var quenue_name = "mark";


              ch.assertQueue(quenue_name, { durable: false, maxLength:10 });
        console.log("Waitting the meesages");
        ch.consume(quenue_name, function (msg) {
            console.log(`Received the msg : ${msg.content.toString()}`);

        }, { noAck: true });
    })
})