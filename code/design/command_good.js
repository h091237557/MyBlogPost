

class AddCommand {
    constructor(value) {
        this.value = value;
        this.name = "Add";
    }

    execute(current) {
        return current + this.value;
    }

    undo(current) {
        return current - this.value;
    }
}

class SubCommand {
    constructor(value) {
        this.value = value;
        this.name = "Sub";
    }

    execute(current) {
        return current - this.value;
    }

    undo(current) {
        return current + this.value;
    }
}

class MulCommand {
    constructor(value) {
        this.value = value;
        this.name = "Mul";
    }

    execute(current) {
        return current * this.value;
    }

    undo(current) {
        return current / this.value;
    }
}
class DivCommand {
    constructor(value) {
        this.value = value;
        this.name = "Div";
    }

    execute(current) {
        return current / this.value;
    }

    undo(current) {
        return current * this.value;
    }
}


class Invoker {
    constructor() {
        this.commands = [];
        this.current = 0;
    }

    execute(command) {
        this.commands.push(command);
        this.current = command.execute(this.current);

        console.log(`Execute command : ${command.name} , and result : ${this.current}`);
    }
    undo() {
        const command = this.commands.pop();
        this.current = command.undo(this.current);

        console.log(`Execute undo and result : ${this.current}`);
    }
    getCurrent() {
        return this.current;
    }
}

const invoker = new Invoker();
invoker.execute(new AddCommand(5)); // current => 5
invoker.execute(new SubCommand(3)); // current => 2
invoker.execute(new MulCommand(3)); // current => 6
invoker.execute(new DivCommand(3)); // current => 2

invoker.undo(); // current => 6

console.log(invoker.getCurrent());