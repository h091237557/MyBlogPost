var amqp = require('amqplib/callback_api');

amqp.connect('amqp://127.0.0.1', function (err, conn) {
    conn.createChannel(function (err, ch) {
        var exchange_name = "logs";
        ch.assertExchange(exchange_name, 'direct', { durable: false });

        ch.assertQueue('', { exclusive: true }, function (err, q) {
            console.log('Waiting for messages');

            var routing_key = 'error';
            ch.bindQueue(q.queue, exchange_name, routing_key);
            ch.consume(q.queue, function (msg) {
                console.log(`Received msg:${msg.content.toString()}`);
                console.log(`routing key is:${msg.fields.routingKey.toString()}`);
            }, { noAck: true });
        })
    })
})