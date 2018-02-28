本文中我們將會知道兩件事件

```
為什麼要使用命令模式呢 ? 
什麼是命令模式呢?
```

## 為什麼要使用命令模式呢 ? 

我們先來想想，假設我們要做一個簡單的計算機的功能，然後他有提供以下方法:

1. 加
2. 減
3. 乘
4. 除


然後實際上執行大概會長這樣 : 

```
add(5) => current = 5
sub(3) => current = 2
mul(3) => current = 6
div(3) => current = 2
```
這樣我們大概會寫個最簡單的程式碼，大概會長成下面這樣:

```

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
```
### 這有啥問題呢 ? 
如果我們這時要增加一個`undo`的功能呢 ? 上面的程式碼的結構就無法做這種功能了，因為它的`緊偶合`了。

> 緊耦合白話文就是你們(模組和類別)關係太好囉 ~ 要修理 A 的話 B 也要先打一頓才行。

而我們上面範例關係太好的兩位可以定義為『行為請求者』與『行為實現者』，行為請求就是指我們外面指接`client.add(5)`，而行為實現者則為`add`方法裡面的實作。

也因為上面這種狀況，所以我們無法做`undo`功能，如果我們想要奇耙一點在這案例做排程或是記錄請求日誌的話，也都很難實現。

所以解法就是 : 

> 將『行為請求者』與『行為實現者』的解耦合，也就是所謂的『命令模式』。


## 什麼是命令模式呢?

> 就是將『行為請求者』與『行為實現者』分開模式。

下圖中，我們會在請求者與實現者的中間增加一個東西，叫作`呼叫者`，你也可以稱為`Invoker`。

這張圖的概念你可以簡單的想成，你去一間餐館食飯，然後你就是『請求者』，負責接受點菜的服務生就是『呼叫者』，而最後實際做飯的就是『實現者』。

那為什麼這叫命令模式呢 ? 因為我們會將所有的請求，都封成一個『命令 command 』物件，接下來的服務生，會將這此命令寫在紙上，然後再由他來決定什麼時後要丟給廚師，而客戶如果要取消命令時，也都會由服務生這裡來經手。

![](http://yixiang8780.com/outImg/20180228-01-command.png)

### 程式碼實作

接下來我們要將上面的程式碼來進行修改，首先我們會多增加上面那張圖中的`Invoker`類別，記好他就是服務生，用來叫廚師做飯的。

這段程式碼中，`execute`就是用來實際叫廚師做飯的方法，而`undo`就是用來執行取消這命令的方法。

```
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
```
然後下面是我們每一個命令，這裡每一個都是廚師，然後裡面都有定義好這個命令實際要做的事情與取消時要做的事情，由於我是用 JS 這種語言來撰寫範例，所以沒有個抽象類別或 介面，不然每一個命令應該都會繼承一個叫 Command 的類別或介面。

```
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
```
最後執行時，我們會麻煩 invoker (服務生)，叫實際執行者 (廚師) 進行工作，並且服務生那裡都有記住我們要點的菜，如果臨時想取消，就很簡單囉。

```
const invoker = new Invoker();
invoker.execute(new AddCommand(5)); // current => 5
invoker.execute(new SubCommand(3)); // current => 2
invoker.execute(new MulCommand(3)); // current => 6
invoker.execute(new DivCommand(3)); // current => 2

invoker.undo(); // current => 6

console.log(invoker.getCurrent());
```

## 結論
今天我們學習了『命令模式』，它主要的功能與目的如下 : 

> 就是將『行為請求者』與『行為實現者』分開的模式，為了更彈性操作命令。

你只要記得餐廳的概念就可以理解命令模式的實作了。

再來我們談談它的優缺點。

它最主要的優點是，可讓我們將『行為要求者』與『行為執行者』分開，使得我們可以做更多的運用，例如取消、寫日誌、交易事務 (就是要麻所有命令都執行要麻不要執行)。

但缺點呢 ? 
不能否認程式碼的複雜度增加與變長，這也代表，不是所有類似這種命令的功能都需要用到這種模式，在設計一個系統時最怕『過度設計』，所以如果你們確定你的系統是需要『對命令進行特殊的動作時(ex: undo)』時，才需要使用到這種模式。

像我剛剛的計算機範例，如果不需要`undo`，那用最一開始的範例就夠了 ~~ 

## 參考資料

* [大話設計模式]()
* [Node.js設計模式]()
* [極客學院-命令模式](http://wiki.jikexueyuan.com/project/java-design-pattern/command-pattern.html)