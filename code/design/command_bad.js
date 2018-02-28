
class Calculator {
    constructor(){
        this.current = 0;
    }
    add(value){
        this.current += value;
    }
    sub(value){
        this.current -= value;
    }
    mul(value){
        this.current *= value;
    }
    div(value){
        this.current /= value;
    }
    getCurrent(){
        return this.current;
    }
}

const client = new Calculator();
client.add(5);
client.sub(3);
client.mul(3);
client.div(3);

console.log(client.getCurrent());