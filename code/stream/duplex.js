debugger;
const stream = require('stream');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

class DuplexStream extends stream.Duplex{
    constructor(){
        super();    
        this.count =0;
    }
    _read(){
        if(this.count <= 10){
            this.push("hello mark");
            this.count++;
        }else{
            this.push(null);
        }
    }
    _write(chunk,encoding,cb){
        const data_path = "test.txt";
        mkdirp(path.dirname(data_path), function(err) {
            if (err) {
                return cb(err);
            }
            fs.writeFile(data_path, chunk, cb);
        });
    }
}

const duplexStream = new DuplexStream();
//duplexStream.on('data', (chunk) => {
    //console.log(chunk.toString());
//});

//duplexStream.write("Hello mark , how are you today?");
//duplexStream.end(()=>{
    //console.log('finish');
//});

duplexStream.pipe(duplexStream);
