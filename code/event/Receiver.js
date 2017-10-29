
const Router = require('./Router');
const router = new Router();

class Receiver {
    constructor (){
    }

    send(){
        router.emit('chat','hello world');
    }
}

module.exports = Receiver;