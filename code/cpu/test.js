const http = require('http');
const child_process = require('child_process');

var count = 0;

http.createServer(async function (req, res) {
    console.log("master:" + process.pid);
    var success = req.url === "/?success=true" ? true : false;
    if (!success){
        try {
            await test();
        } catch (error) {
            res.writeHead(500);
            res.end;
        }
    }
    res.writeHead(200);
    res.end();
}).listen(8000, function () {
    console.log('started');
});


function test(){
    throw new Error("So sad");
    return Promise.resolve("hello");
}
