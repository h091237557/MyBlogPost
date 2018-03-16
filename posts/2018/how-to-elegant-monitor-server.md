# 如何使用 Prometheus 來優雅的監控 Node Http Server 呢

本篇文章中我們將會學習到以下幾個重點

1. 什麼是 Prometheus 呢 ?
2. 要如何監控 node http server 呢 ?
3. 我想從 Prometheus 監控自訂的資訊，要如何做呢 ?

## 什麼是 Prometheus 呢 ?

在我們平常開發完系統時，我們常常會有個需求，那就是要如何監控我們的系統呢 ?
以確保它 cpu 往上衝時，我們會知道呢。

當然我們可以很簡單的寫個小程式，定期的去呼叫系統取他的 cpu，這是很淺的東東 ~ 那如果是還要一個 api 的請求次數呢 ? 或是平均的某個 api 的請求次數或圖表呢 ? 這時如果還要自幹一個，那就太麻煩囉，所以這時我們就可以使用`Prometheus` ~ 

Prometheus 官網上面寫了下面這段話 : 

> Power your metrics and alerting with a leading open-source monitoring solution.

這句話就是 Prometheus 存在的目的。

### Prometheus 的架構
太細節的不說囉 ~ 這裡大概列出這個架構的三個重點:

1. Prometheus 是用 pull 去取得目標資訊，下面的 pull metrics 就是這個意思，而這裡你只先去記一點，如果你有個 http server ，然後你要用 Prometheus 去監控 server ，那 Prometheus 就會去 xxxx_host/metrics 取得資訊。
2. PromQL 是 Prometheus 所提供的查詢語言，利用它可以快速的找到我們想要的資訊 (大概)。
3. AlertManager 是一個警告系統，你只要配置好 Prometheus 在某個東東到了報警線時，就自動發送警告到 AlertManager 然後它會使用某些方法通知你，例如 email or slack。

![](http://yixiang8780.com/outImg/20180314-1.png)

### 安裝 Prometheus
請直接到官網直接下載下來。

```
https://prometheus.io/download/
```

接下來在解壓縮

```
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

然後進到解壓縮後的資料夾後，執行以下指令，就可以開啟 Prometheus 。

```
./prometheus
```

## 要如何監控 node http server 呢 ?

再開始前我們先去 prometheus server 的資料夾下修改一下 prometheus.yml 這檔案，基本上我們只要先調整 scrape_configs 裡的 scrape_configs，設定 prometheus server 要去監控的目標，如下我們去監控`localhost:3000`。

```
# my global config
global:
  scrape_interval:     5s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 5s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      # - alertmanager:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'test'

    static_configs:
      - targets: ['localhost:3000']

```

然後我們就可以簡單的寫一個 nodejs 的 http server 。

```
const http = require('http')
const port = 3000

const requestHandler = (request, response) => {
    response.end('Hello Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
})
```

接下來，我們需要建立一個 api endpoint 的`/metrics`。

```
const http = require('http');
const port = 3000;

const requestHandler = (request, response) => {
  if (request.url === '/metrics') {

  }
  response.end('Hello Node.js Server!');
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});
```

然後上面有說過 Prometheus 會去監控的目標抓取資訊，而他抓的地方就是`/metrics`，然後這時我們裡面就要回傳資訊回去。

這裡我們會使用`prom-client`套件，這個套件是一個 Prometheus client ，它會幫我們抓取他自訂的資料，並且將資料已 Prometheus 可以接受的格式回傳回去。

```
npm install prom-client
```

然後再將 endpoint 修改成如下。

```
const http = require('http');
const port = 3000;
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const requestHandler = (request, response) => {
  if (request.url === '/metrics') {
    response.end(client.register.metrics());
  }
  response.end('Hello Node.js Server!');
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});
```

那要如何驗證有沒有資料呢 ? 你只要去 chrome 然後打`http://localhost:3000/metrics`然後你看到下面的資訊，就代表你有在產生資料囉，下面這些是`prom-client`自已會去抓 process 的一些相關資訊，如果要自訂的資訊請看下一章結 ~ 

```
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.015771 1520243222641

# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.
# TYPE process_cpu_system_seconds_total counter
process_cpu_system_seconds_total 0.000973 1520243222641

# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 0.016744000000000002 1520243222641

# HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1520243212

# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 26382336 1520243222641

# HELP nodejs_eventloop_lag_seconds Lag of event loop in seconds.
# TYPE nodejs_eventloop_lag_seconds gauge
nodejs_eventloop_lag_seconds 0.00048715 1520243222642

# HELP nodejs_active_handles_total Number of active handles.
# TYPE nodejs_active_handles_total gauge
nodejs_active_handles_total 3 1520243222641

# HELP nodejs_active_requests_total Number of active requests.
# TYPE nodejs_active_requests_total gauge
nodejs_active_requests_total 0 1520243222641
```

最後我們先開啟 Prometheus ，然後連線到`http://localhost:9090/`，最後到 status 裡面的 target 裡面，你如果看到你的 endpoint 的 state 是`up`就代表 Prometheus 有成功的去那抓資料囉。

![](http://yixiang8780.com/outImg/20180314-2.png)

## 我想從 Prometheus 監控自訂的資訊，要如何做呢 ?

### 定義好符合 Prometheus 的時序資料格式 metric

假設我們想要自訂個內容，然後給 Prometheus server 抓取，第一步我們要先定義好『資料模式』，你把他想成 server 與 client 的協定就好囉，然後他長的如下:

```
<metric name>{<label name>=<label value>, ...}
```

假設我們要定義一個『ID 1 的聊天室用戶人數』那他的定義應該會長下面這樣: 

```
chatRoomCount{ chat_id=“1”} 100(人數)
```
### 決定時序資料的類型
在 Prometheus 中有提供四種時序資料的類型

#### Counter
這種類型用於『累積值』，例如 Prometheus 內建提供的 http 請求數或錯誤量，它的類型就是 Counter 。

```
http_response_total{method="GET",endpoint="/api/peoples"} 10
http_response_total{method="GET",endpoint="/api/peoples"} 20
http_response_total{method="GET",endpoint="/api/peoples"} 30
```

#### Gauge
這種類型用於『常規值』，例如 cpu 使用率或記憶體使用率就是此類型。

```
memory_usage_bytes{host=“server-01"} 50
memory_usage_bytes{host=“server-01"} 100
memory_usage_bytes{host=“server-01"} 80
```

#### Histogram
主要用於一段時間範圍內對資料的採集，並且可針對內容進行分組。

```
{小於100毫秒=5次，小於500毫秒=1次，小於100毫秒=2次}
```

#### Summary
與 Histogram 相同且支持百分比與跟蹤的結果。

比較詳細的類型說明請參考下篇文章，寫的很詳細的。
[傳送門](http://yunlzheng.github.io/2017/07/07/prometheus-exporter-example-go/)

### 實作『用戶使用』人數的自訂內容
假設我們希望 Prometheus 可以去指定的`聊天室` Server，抓取使用人數的資訊，那我們要如何實作呢 ? 

根據上面的教學我們要先定義好資料格式與資料類型。

```
//資料格式 => 代表聊天室`1`的使用人數當下有多少人.
chatRoomCount{ chat_id=“1”} 100(人數)
```

```
//資料類型 => 會選擇 Gauge 而不選 Counter 是因為聊天室的人數是會上下變動，而不是只增加或減少。
Gauge
```

接下來我們就來實作一下，首先做出自訂資料的格式定義與類型。

```
// 定義自訂 metric 的格式與類型
// 格式: chatRoomCount{ chat_id=“1”} 100(人數)
// 類型: Guage
const guage = new client.Gauge({
  name: 'chatRoomCount',
  help: 'The metric provide the count of chatroom`s people',
  labelNames: ['chat_id']
});
```

然後下面就是所有的程式碼，主要的重點就是定義格式，然後讓 Prometheus 從`/metrics`這個 api 取得資料前，先將 count 資訊更新到 metric 裡面。

```
const http = require('http');
const port = 3000;
const client = require('prom-client');
let count = 0;
const guage = new client.Gauge({
  name: 'chatRoomCount',
  help: 'The metric provide the count of chatroom`s people',
  labelNames: ['chat_id']
});

const requestHandler = (request, response) => {
  if (request.url === '/metrics') {
    // 更新 metric
    guage.set({
      chat_id: '1'
    }, count);
    response.end(client.register.metrics());
  }
  if (request.url === '/add') {
    count++;
    response.end(`now ~ count:${count}`);
  }
  if (request.url === '/leave') {
    count--;
    response.end(`now ~ count:${count}`);
  }

  response.end('Hello Node.js Server!');
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
  console.log(`server is listening on ${port}`);
});
```

那我們要如何確認有產生資料呢 ? 你先加幾個用戶幾去，然後再去打`/metrics`就可以看到結果囉。

```
http://localhost:3000/add // 加一人
http://localhost:3000/add // 加一人

http://localhost:3000/metrics
```

結果如下。

```
# HELP chatRoomCount The metric provide the count of chatroom`s people
# TYPE chatRoomCount gauge
chatRoomCount{chat_id="1"} 2
```

最後你在去`http://localhost:9090`你就可以看到那個 tab 中會多增加了`chatRoomCount`的標籤，然後點進去選 graph 你就可以看到你的圖表了。

![](http://yixiang8780.com/outImg/20180314-3.png)

![](http://yixiang8780.com/outImg/20180314-4.png)

## 參考資料

* [开源监控系统Prometheus的基本概念 - 青蛙小白](https://blog.frognew.com/2017/05/prometheus-intro.html)
* [官網](https://github.com/siimon/prom-client)
* [用 Golang 實作 Prometheus：服務效能測量監控系統 - 電腦玩瞎咪](https://yami.io/golang-prometheus/)
* [簡書 Prometheus - YichenWong](https://www.jianshu.com/p/0a4acb61ce35)