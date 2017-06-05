
const Readable = require('stream').Readable;

class Read extends Readable {
    constructor(data) {
        super();
        this.data = data;
        this.dataLength= data.length;
        this.count=0;
    }

    _read(){
        const chunk = this.data.slice(this.count,this.count+1);
        if(this.count === this.dataLength){
            this.push(null);
        }else{
            console.log('Pushing chunk of size:' + chunk.length);
            this.push(chunk, 'utf8');
            this.count++;
        }
    }
}

const testStr = new Array(10).join('喝');

const markStream = new Read(testStr);
markStream.on('readable', function(){
    let chunk ;
    while ((chunk = markStream.read()) !== null){
        console.log("chunk received:" + chunk.toString()); 
    }
});
