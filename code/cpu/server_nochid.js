const http = require('http');

http.createServer(function (req, res) {
    console.log("master:" + process.pid);

    res.writeHead(200);
    res.write(fib(40).toString());
    res.end();

}).listen(8000, function () {
    console.log('started');
});

function fib(n) {
    return n > 1 ? fib(n - 1) + fib(n - 2) : 1;
}
