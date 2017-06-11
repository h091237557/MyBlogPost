const stream = require('stream');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

class Write extends stream.Writable {
    constructor() {
        super();
    }

    _write(chunk, encoding, cb) {
        const data_path = "test.txt";
        mkdirp(path.dirname(data_path), function(err) {
            if (err) {
                return cb(err);
            }
            fs.writeFile(data_path, chunk, cb);
        });
    }
}

const markStream = new Write();
markStream.write("Hello mark , how are you today?");
markStream.end(()=>{
    console.log('finish');
});
