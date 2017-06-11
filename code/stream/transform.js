const stream = require('stream');

class TransofrmStream extends stream.Transform{
    constructor(search_string, replace_string){
    super({decodeStrings:false});    
        this.search_string=search_string;
        this.replace_string = replace_string;
    }
    _transform(chunk, encoding, cb){
        const result = chunk.toString().replace(this.search_string,this.replace_string);
    this.push(result);
    cb();
    }
    _flush(cb){
        this.push('!!!!')
        cb();
    }
}

const transofm_stream = new TransofrmStream('World', 'Mark');
transofm_stream.on('data', (chunk) => {
    console.log(chunk.toString());
})

transofm_stream.write('Hello World');
transofm_stream.write('Mark ! you are my all World');
transofm_stream.end();
