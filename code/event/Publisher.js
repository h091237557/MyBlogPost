const Router = require('./Router.js');
const router = new Router();

class Publisher {
    constructor (){
        router.on('pub:chat',() => {
            console.log("Publisher !!! send")
        });
    }
}



module.exports = Publisher;