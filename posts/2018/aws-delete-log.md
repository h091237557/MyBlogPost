# 要如何定期的清除 Elasticsearch 文件 ?

上一篇文章[『一個基於 AWS Elasticsearch 的用戶行為 log 系統建立』](http://marklin-blog.logdown.com/posts/7801415-establishment-of-a-log-system-based-on-aws-elasticsearch)中我們說明了，如何使用 AWS Elasticsaerch 來建立收集 log 的系統，而 log 系統通常也有一種需求，那就是需要定期的清除舊的 log ，所以本篇文章的主題為:

> 要如何定期的清除 Elasticsearch 文件 ?

然後我們會分成以下幾個章節:

* 最直覺式的定期刪除方法與缺點。
* 為什麼大量文件的清除對 Elasticsearch 會很耗資源呢 ?
* 大量文件清除方法 - 時間索引策略。

## 最直覺式的定期刪除方法與缺點
假設有以下的資料:

```
{
  data: 'Hi Mark ~',
  created_at: '20180101'
},
{
  data: 'HI Fuc u Mark',
  created_at: '20180201'
}
```
那我們要清除 1 月份的 log ，那我們最直覺的做法，應該會如下的操作:

1. 搜尋所有 created_at 為 1 月的 doc。
2. 再將所有搜尋出的 doc 給清除。

> 上面這方法在小量資料時，是沒問題的，問題是出在大量資料。

那為什麼大量資料刪除會有問題呢 ?

Elasticsearch 在進行刪除時，它是將 doc 給一個此 doc 已刪除的 tag ，然後再接下來的搜尋時，會自動將有 tag 的 doc 給過濾掉，這也代表在清除的當下資源沒有被釋放出來。

接下來 Elasticsearch 會在某個條件下，會執行`segment merging`的工作，這個時後它才會將實際上的文件清除，而且這個工作在大量資料下，會非常的消耗 cpu 與 i/o 的資源。

## 為什麼大量文件的清除對 Elasticsearch 會很耗資源呢 ?

要理解這個問題，我們就要從`倒排索引`開始說起，不熟可以去我這篇[Elasticsearch 的 Document 建立原理](http://marklin-blog.logdown.com/posts/7346272)看個兩三下。

### 倒排索引的建立
首先，每當一個 doc 建立時，它會先被丟到一個叫 memory buffer 的地方，等到一段時間 or buffer 滿了，系統會將它建立成一個`segment`，如下圖。

![](http://yixiang8780.com/outImg/20180702-01-delete-log.png)

而這個 segment 就是我們的`倒排索引`集合，它也是在我們在進行搜尋時，會實際去尋找的地方。這裡有一個很重要的事情要說:

> 每一個 segment 內的倒排索引是不可以變的。

所以說如果你新增了第二個 doc ，它會在去新增一個 segment，那你在『某段時間』內，會有 2 個 segment，然後搜尋時，就是去每個 segment 中搜尋，然後將結果進行合併，得出結果。

![](http://yixiang8780.com/outImg/20180702-02-delete-log.png)

### 多個 segment 會有什麼問題呢 ?

首先 segment 裡面是存放倒排索引的資訊，而這個東西，它是寫在`硬碟`中。所以如果每一次進行搜尋時，有 100 segment 個代表你要開啟 100 個檔案，如果越來越多，你的 i/o 與 file descriptor 遲早會出問題。

### 解決多個 segment 的方法 segment merging，但它很耗資源
所以 Elasticsearch 提出了一個機制，那就是`segment merging`。

這個東東將是會定時的將小 segment 合成一個大的 segment，如下圖。

![](http://yixiang8780.com/outImg/20180702-03-delete-log.png)

這項工作是非常的消耗資源的，如果你有 100 個小的 segment，你就要將開啟 100 條的 i/o 並且需要進行大量的運算。

> 而且如果你還大量刪除了 doc ，它還要去某個檔案中，抓取已刪除的檔案編號，然後在和原本的每一個 segment 進行比對，再組合成 1 個新的 segment。這想也知道會非常的耗 CPU 與 i/o 資源。



## 大量文件清除方法 - 時間索引策略

所以為了解決這個問題，我們將會使用時間索引策略來進行 doc 的刪除。

> 這策略概念就是每天(or 區間)產生一個 index，然後過時了再砍掉它

首先為了別讓人搞混，我先畫張圖，此索引非倒排索引。從下圖中我們可以知道一個 Elasticsearch  的 Index 是由不同節點的 shard 組合而成，然後每個 shard 裡面包含了 doc 與 segment。

![](http://yixiang8780.com/outImg/20180702-04-delete-log.png)

所以說，我們可以知道每個 segment 都是包含在一個 index 中，那我們想想看下面這個問題 ? 

> 假如我們直接刪除了 index 後，segment 會著麼樣呢 ?

答案就是 doc 與 segment 都一起消失，不需要在做那些 segment merging 啥的。

所以我們這裡的策略就是:

> 根據時間來建立 index (假設每天) ，然後每當要清除舊 log 時，我們就將指定的 index 給清除就好，這樣就不需要執行 segment merging 這種耗資源的工作了


### 時間索引策略 part1 - 建立 index template

首先我們要建立一個 index 的 template，如下，建立完成以後，我們接下來每次只要建立的索引名稱為`api-*`這種類型 (ex. api-2018-01-01) ，系統就會依照下面的範本來進行建立。

然後`aliases`就是別命，假設建立出來的索引為 api-2018-01-01，我們就可以使用 api 這個別命來操作它，所以這也代表我們每一次新增 doc 指令索引時，不用一直換啊換。

```
 await client.indices.putTemplate({
      name: 'api-template',
      template: 'api-*',
      body: {
        'settings': {
          'number_of_shards': 5,
          'number_of_replicas': 1
        },
        'aliases': {
          'api': {}
        },
        'mappings': {
          'log': logMapping
        }
      }
    });
```

### 時間索引策略 part2 - 排程每天建立一個新的索引，並將操作指向它

下面這個 api 就是會依據`max_age`與`max_docs`的條件，來決定是否建立索引，其中一個符合，那就會建立新的索引，並且將操作(新增 doc)指向這個新建立的索引。

下面這個範例，rollover 會自動依流水號來建立 index，當然也可以依據時間來建立，請參考[官網這篇文章](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html)。

```
POST api/_rollover
{
  "conditions": {
    "max_age":   "1d",
    "max_docs":  5
  }
}
```
```
{
  "old_index": "api-logs-1",
  "new_index": "api-logs-2",
  "rolled_over": true,
  "dry_run": false,
  "conditions": {
    "[max_docs: 5]": true,
    "[max_age: 7d]": false
  }
}
```

> P.S 如果是使用 AWS kinesis 的話，這一步可以不用做，在設定它時，有個叫 Index rotation 的參數可以設定，它可以設定 hour、day、week、month，功能就和上面的一樣

### 時間索引策略 part3 - 定時的清除索引
如果你的索引名稱如`api-2018-01-01`這種類型的話，你可以依據它來選擇清除，而如果你的命名不是這樣的話，那你可以使用下面這個 api 來知道每一個索引的建立時間。

```
curl http://localhost:9200/_cat/indices\?h\=h,s,i,id,p,r,dc,dd,ss,creation.date.string
```
結果如下圖。

![](http://yixiang8780.com/outImg/20180702-05-delete-log.png)

###  時間索引策略 part4 - 搜尋的操作

`rollover` api 上面有提到，會將所以的操作自動的轉向到新的索引，所以你如果要進行搜尋操作時，你可以執行下面的指令，這樣你所有的索引都可以尋找到。

```
curl http:127.0.0.1:9200/api-*/_search?pretty
```

## 參考資料
* [官網-分配內部原理](https://www.elastic.co/guide/cn/elasticsearch/guide/current/inside-a-shard.html)
* [官網 rollover api](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html)
* [managing-time-based-indices-efficiently](https://www.elastic.co/blog/managing-time-based-indices-efficiently)