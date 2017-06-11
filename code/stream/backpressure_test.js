debugger;
const stream = require('stream');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const chance = require('chance').Chance();
const usage = require('usage');

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
            console.log('push')
            fs.writeFile(data_path, chunk, cb);
        });
    }
}


const testStream = new Write();
function generateMoreData() {
    while (chance.bool({likelihood: 95})) {
        let is_continue_write_data = testStream.write(
            chance.string({length: (16* 1024) -1}) 
        ); 

        if(!is_continue_write_data){
            //watchMem();
            console.log('Backpressure');
            return testStream.once('drain', generateMoreData);
        }
    }
}
function watchMem(){
    const pid = process.pid;
    usage.lookup(pid, function(err, result){
        console.log(result);
    });
}

generateMoreData();
