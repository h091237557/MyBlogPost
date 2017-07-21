const http = require('http');

http.createServer(function (req, res) {
    console.log("master:" + process.pid);
    res.writeHead(200);
    res.write("port:" + this._connectionKey.toString());
    res.end();

}).listen(process.env.PORT || process.argv[2] || 8080, function () {
    console.log('started:' + process.pid);
});

// http.createServer(function (req, res) {
//     console.log("master:" + process.pid);
//     console.log("port:" + this._connectionKey.toString());
//     res.writeHead(200);
//     res.write("port:" + this._connectionKey.toString());
//     res.end();

// }).listen(8080, function () {
//     console.log('started:' + process.pid);
// });

function fib(n) {
    return n > 1 ? fib(n - 1) + fib(n - 2) : 1;
}
