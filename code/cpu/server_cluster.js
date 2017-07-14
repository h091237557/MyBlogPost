const http = require('http');
const child_process = require('child_process');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log("master process:" + process.pid);
    console.log("cpu num: " + numCPUs.toString());

    process.on('SIGUSR2', function () {
        console.log("Restarting workers");
        var workers = Object.keys(cluster.workers);
        
        function restartWorker(i){
            if ( i >= workers.length) return;
            var worker = cluster.workers[workers[i]];
            console.log('Stopping worker:' + worker.process.pid);
            worker.disconnect();

            worker.on('exit', function () {
                if(!worker.exitedAfterDisconnect) return;

                var newWorker = cluster.fork();
                newWorker.on('listening',function () {
                    restartWorker(i+1);
                })
            })

        }
        restartWorker(0);
    })

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
        // cluster.on('exit', function (worker, code) {
        //     if (code != 0 && !worker.exitedAfterDisconnect) {
        //         console.log('Worker crashed. Starting a new worker');
        //         cluster.fork();
        //     }
        // })
    }
} else {
    http.createServer(function (req, res) {
        console.log("process run:" + process.pid);
        res.writeHead(200);
        res.write(fib(30).toString());
        res.end();

    }).listen(8000, function () {
        console.log('started');
        console.log("process:" + process.pid);
    });
}

function fib(n) {
    return n > 1 ? fib(n - 1) + fib(n - 2) : 1;
}
