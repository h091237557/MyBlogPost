var amqp = require('amqplib/callback_api');

amqp.connect('amqp://127.0.0.1', function (err, conn) {
    console.log("connect amqp server !");

    conn.createChannel(function (err, ch) {
        var exchange_name = "logs";
        var msg = "Hello mark";
        var routing_key = "error";

        ch.assertExchange(exchange_name, 'direct', { durable:false });
        ch.publish(exchange_name, routing_key, new Buffer(msg));
        console.log(`send msg: ${msg}`);
    })
})