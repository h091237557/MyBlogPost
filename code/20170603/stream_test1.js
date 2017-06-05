// buffer
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    fs.readFile('aaa.avi', (err, data) => {
        if(err) {
            console.log(err); 
            res.writeHead(500);
            res.end(err.message);
        } else{
            res.writeHead(200, { 'Content-Type': 'video/avi' });
            res.end(data);
        }    
    });
});

server.listen(3000, () => {
    console.log('server up !');
});

// stream
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'video/avi' });
    fs.createReadStream('aaa.avi').pipe(res)
        .on('finish', () => {
            console.log('done');
        });
});

server.listen(3000, () => {
    console.log('server up !');
});
