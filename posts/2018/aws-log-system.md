# 一個基於 AWS Elasticsearch 的 log 系統建立

本篇文章中，我們要說明的主題為 :

> 如何使用 AWS Elasticsearch 來建立一個 log 系統。

本篇文章中，我們將分成以下的主題:

1. Log 系統的架構說明
2. AWS 的工具申請 (Elasticsearch、Kinesis、S3)
3. Log client 端的小實作

## Log 系統的架構說明

### V1

一個最簡單的 log 架構，應該會長的如下圖一樣，一個 log 來源與 log 接受端。

其中 log 接受端，有很多種選擇，你可以選擇來源端的本機，並且選擇將之儲放成文字檔，又或是儲放在某個資料庫中，各種儲放法都優有缺。

這裡我們選擇了使用`Elasticsearch`來當接受端，主要的理由如下:

1. 可以進行快速的搜尋
2. 可擴展性強

但相對的與文本儲放相比，那缺點就是空間一定比文本的大，因為文本可以壓縮，不過文本的搜尋速度可就 QQ 囉。

![](http://yixiang8780.com/outImg/20180628-1-log.png)

### V2
那 V1 有什麼缺點呢 ? 假設我們 Elasticsearch 上天堂，或是要停機更新一下，那這些 log 會著麼樣呢 ? 當然就是消了囉，雖然你可能會覺得 log 消失一些沒啥差別，但如果剛好是出問題的地方，那你真的會罵髒話了。

所以這裡我們會增加一個`Broker`，架構圖如下，所有的資料來源都會先送到`Broker`來後在送到儲放點。

這裡我們選擇了`AWS kinesis`，它的優點如下:

1. 擁有 Queue 的機制，也就是說如果資料儲放點上天堂在 24 小時以內，只要回復了，它會自動將這些 log 在丟過去。
2. Amazon Kinesis 可處理任何數量的串流資料，不用擔心它爆掉就對了。
3. 可以設定 log 同步也備份到 S3。

![](http://yixiang8780.com/outImg/20180628-2-log.png)

### V3
那 V2 有啥缺點呢 ? 事實上已經沒啥太大的缺點，但是有個問題，因為我們資料來源端是儲放在 Elasticsearch ，而它的缺點就是，成本比較高，基本上 1 MB 的壓縮文檔 log ，轉換到 Elasticsarch 中大約會乘上 10 ~ 15 倍，所以除非公司錢很多，不然不會將太多的 log 儲到 Elasticsearch 中。

所以這裡我們的方案是，只在 Elasticsearch 中儲放約 1 個月的資料，然後超過一個月的資料都將儲放到 S3 中，有需要時在時用`AWS Athena`來查詢。

最後架構就長的如下圖:

![](http://yixiang8780.com/outImg/20180628-3-log.png)

## AWS 的工具申請 (Elasticsearch、Kinesis、S3)
由於 Elasticsearch 與 S3 建立資訊，網路上都很多了，所以本篇就不多說囉。

### AWS Elasticsearch
下圖為 aws elasticsearch 建立好的狀態，然後你只要用 curl 打它給的網址，有出現像下面的訊息輸出，那就建立成功囉。

![](http://yixiang8780.com/outImg/20180628-4-log.png)

![](http://yixiang8780.com/outImg/20180628-6-log.png)

### AWS S3
就是點個 create bucket 那個鈕，然後一直按就好了，然後其它細節 google 一下就有囉。

![](http://yixiang8780.com/outImg/20180628-5-log.png)

### AWS Kinesis
接下來 AWS Kinesis 的設定 google 比較難找到，所以來個比較詳細點兒的說明。

AWS Kinesis 有分為四種，其中我們要使用的為`Amazon Kinesis Data Firehose`。

然後建立步驟如下。

#### 1. 填寫它的 Delivery stream name 
到時我們要丟 log 到 stream 時需要使用到他。

![](http://yixiang8780.com/outImg/20180628-8-log.png)

#### 2. 選擇資料來源
它有兩個選項分別為 Direct PUT or other sources 與 Kinesis stream ，這裡我們選擇 Direct PUT or other sources，我們只要知道選了它，就可以使用 AWS SDK 的 PUT APIs 來將資料丟到 Kinesis 中。

![](http://yixiang8780.com/outImg/20180628-9-log.png)

#### 3. 選擇是否要將資料進行加工後，再丟到儲放端
這裡可以讓我們決定，是不是要將 kinesis 中的資料，經過『加工』後，再丟到儲放端，加工的選擇有 AWS Lambda 或是 AWS Glue ，這裡我們先不需要處理，所以都選`Disable`。

![](http://yixiang8780.com/outImg/20180628-10-log.png)

#### 4. 選擇資料儲放端 - AWS Elasticsearch
然後選擇我們要把資料丟到 Amzaon Elasticsearch Service。

![](http://yixiang8780.com/outImg/20180628-11-log.png)

#### 5. 設定 AWS Elasticsearch 的目的
這裡我們一個一個來看要填啥。

* **Domain**: 就是選擇你建立好的 AWS ES 的 domain，正常來說你點那個選項鈕應該都會跑出你剛剛建立的 AWS ES。
* **Index**: 選擇你要將資料丟到 ES 的那個索引，如果那個索引不在則會自動新建一個。這裡我們建立一開始先預先建好，如果沒有，它會依據你丟的 doc 來建立一個索引，而這索引可能有很多你用不到的東西。
* **Index rotation**: 這個地方你可以設定是否給你的索引設定時間簽，假設你上面設的索引為`api`，那如果選擇`一天`，那生出來的索引會長成`api-2018-01-01`這樣，然後你到第二天時再丟個 doc 索引會長成`api-2018-01-2`，這裡關係到索引策略的問題，如果只是簡單試用，就不用設這個 (會另開一篇來討論索引策略)。
* **Type**: 就是設定 ES Index 中 type 選擇。
* **Retry duration**: 就是重試時間。

![](http://yixiang8780.com/outImg/20180628-12-log.png)

#### 6. 設定 S3 備份
這就是 kinesis 方便的地方，他可以自動的幫我們將 log 備份到 S3，而你可以選擇全部備份或是失敗的 log 才記錄。

![](http://yixiang8780.com/outImg/20180628-13-log.png)

#### 7. 設定 AWS kinesis 的執行區間
AWS kinesis 並不是一收到資料就直接將它丟到儲放端，它有兩個條件。

1. Queue 的 buffer 大小 (1 - 100 MB)。
2. 幾秒鐘一次 (60 - 900 sec)。

> 所以記好，這個系統架構，並不是丟了一個 log 指令後，馬上就會在 Elasticsearch 看到 ! 最快也要一分鐘後。

![](http://yixiang8780.com/outImg/20180628-14-log.png)
 
#### 8. 設定 S3 是否要壓縮與加密 (END)
這個地方就是決定 S3 備份要不要壓縮與加密，這裡會不會影響到`AWS Athena`查詢，需待查。

![](http://yixiang8780.com/outImg/20180628-15-log.png)

## Log client 端的實作

要使用 AWS SDK APIs 要先在我們的家目錄中的`~/.aws/credentials`設定一個檔案，內容如下:

```
[default]
aws_access_key_id=your access key
aws_secret_access_key=your secret access key
```
然後我們就可來進行實做，咱們使用`nodejs`來將 log 丟到`AWS kinesis`中。

下面的程式碼就是將 log 丟到 AWS kinesis 中，就是如此的簡單。這裡有兩個東西要注意一下，首先是`region`記得要選擇你所建立 kineses 所在的區域 ; 另一個就是`streamName`，這個記得要改成你所建立的 stream 名稱。

```
const AWS = require('aws-sdk');
const firehose = new AWS.Firehose({region: 'ap-northeast-1'});

function putRecord (dStreamName, data, callback) {
  var recordParams = {
    Record: {
      Data: JSON.stringify(data)
    },
    DeliveryStreamName: dStreamName
  };

  firehose.putRecord(recordParams, callback);
}

const streamName = 'mark-api-stream';
const time = (new Date()).toISOString();
const log = {
  data: `HI Mark ${time}`
};
putRecord(streamName, log, (err, res) => {
  console.log(err);
  console.log(res);
});
```
### 最後送完後等一分鐘在去 Elasticsearch 與 S3 應該就會有資料了。

```
curl 'your aws elasticsearch ul'/{index}/_search?pretty
```


## 參考資料
* [ONLY AWS 開發文件](https://docs.aws.amazon.com/zh_cn/firehose/latest/dev/before-you-begin.html)


CREATE EXTERNAL TABLE IF NOT EXISTS json_table5 (
  `data` string,
  `name` string
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
WITH SERDEPROPERTIES (
  'serialization.format' = '1',
  'field.delim' = ' '
) LOCATION 's3://<bucketname>/';
