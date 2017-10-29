const EventEmitter = require('events');

class Router extends EventEmitter {
    constructor (){
        super();
        this.on('chat',() => {
            console.log("hi mark");
            this.emit('pub:chat',"hi publish")
        });
    }
}

module.exports = Router;