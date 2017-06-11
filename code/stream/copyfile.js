const fs = require('fs');

const readStream = fs.createReadStream(process.argv[2]);
const writeStream = fs.createWriteStream(process.argv[3]); 

readStream.pipe(writeStream);

