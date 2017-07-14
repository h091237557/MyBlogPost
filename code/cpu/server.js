const http = require('http');
const child_process = require('child_process');

var count = 0;

http.createServer(function (req, res) {
    console.log("master:" + process.pid);
    const child = child_process.fork('./subset.js');
    child.send({ value: 30 });

    if(count == 0){
    console.time("test");
    }
    count++;
    child.on('message', function (m) {
        count--;
        if (count == 0) {
            console.timeEnd("test");
        }
        res.writeHead(200);
        res.write(m.result.toString());
        res.end();
    })
}).listen(8000, function () {
    console.log('started');
});

function fib(n) {
    return n > 1 ? fib(n - 1) + fib(n - 2) : 1;
}
