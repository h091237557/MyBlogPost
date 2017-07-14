function fibo(n){
    return n>1 ? fibo(n-1) + fibo(n-2) : 2;
}

process.on('message', function (message) {
    console.log("child:" + process.pid)
    process.send({result: fibo(message.value)});
})

