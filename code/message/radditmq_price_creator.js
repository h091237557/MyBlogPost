var amqp = require('amqplib/callback_api');

amqp.connect('amqp://127.0.0.1', function (err, conn) {
    console.log("connect amqp server !");

    conn.createChannel(function (err, ch) {
        var quenu_name = "mark";


        ch.assertQueue(quenu_name, { durable: false, maxLength: 10 });
        var i = 0;
        setInterval(function () {
            i++;
            ch.sendToQueue(quenu_name, new Buffer(i.toString()));
            console.log(`Send a message:${i.toString()}`);
        }, 500)
    })
})