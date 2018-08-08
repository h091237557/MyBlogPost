# Elasticearch 與 kibana 之日期的愛恨情仇

我相信有使用過 Elasticsearch 的人都應該是會被他的日期時區的問題搞到很火。

在開始搞前先說說我的簡單需求:

>  馬克大希望可以使用 ISO 標準來進行範圍搜尋，例如`2017-07-16T19:20:30`。

這時通常時間的儲法會有兩種選擇:

* Timestamp
* ISO 標準


## 咱們先來看看 Timestamp 的儲法與查找

下面為範例程式碼(nodejs)，其中 putRecord 我就不寫了，因為只是範例，反正就是透過 aws kinesis 來將資料丟到 aws elasticsearch 上。

其中 test 為我們要丟到 elasticsearch 的資料，這裡我們要注意的 created_at 我們將會丟 timestamp 的進去。

```
const streamName = 'mark-stream';

const test = {
  name: 'Mark III',
  age: 40,
  created_at: Date.now() // timestamp 1533634630945 ,
};

putRecord(streamName, test, (err, res) => {
  console.log(err);
});
```
### Elasticsearch 查找

然後我們直接下來找找剛剛新增的那一筆。

```
curl 127.0.0.1/_search?pretty
```

```
{
        "_index" : "api",
        "_type" : "log",
        "_id" : "2139103",
        "_score" : 1.0,
        "_source" : {
          "name" : "Mark III",
          "age" : 40,
          "created_at" : 1533634726145 (2018年08月07日17點38分46秒),
        }
      }
```

那接下來我們在來根據時間區間來進行搜尋會如何呢??

```
POST _search
{
    "query": {
        "range" : {
            "created_at" : {
                "gt" : "2018-08-07T17:00:22" ,
                "lt" : "2018-08-07T18:00:22",
            }
        }
    },
    "sort": [
    {
      "created_at": "asc"
    }
  ]
}
```
**找不到 !!!!**

然後我們如果改成如下的 query，就找的到了…… 

```
POST api/_search
{
    "query": {
        "range" : {
            "created_at" : {
                "gt" : "2018-08-07T09:00:22" ,
                "lt" : "2018-08-07T10:00:22"
            }
        }
    },
    "sort": [
    {
      "created_at": "asc"
    }
  ]
}
```
### 為什麼儲 timestamp 的搜尋要將時間減 8 小時呢 ??

先來看看 timestamp 的意思為啥 ? 

> timestamp 是指格林威治時間1970年01月01日00时00分00秒到現在的總秒數。

那格林威治時間離咱(台灣)這裡多遠 ?

> + 8 個小時

所以說 1533634726145 實際上是指`2018年08月07日9點38分46秒`而不是`2018年08月07日17點38分46秒`，所以假設我們不給時間區域而直接下 query 就會發生找不到的情況，下面為我們有給時間區域的下法，這樣就找的到了。

下面這種下法的意思就是，我們要找這段時間的資料，並且我們的時間區域在`+8`小時的地方。

```
POST api/_search
{
    "query": {
        "range" : {
            "created_at" : {
                "gt" : "2018-08-07T17:00:22",
                "lt" : "2018-08-07T18:00:22",
                "time_zone": "+08:00"
            }
        }
    },
    "sort": [
    {
      "created_at": "asc"
    }
  ]
}
```
### 那在 kibana 的 discover 要如何下 query ? 

在 kibana 如果執行下面的 lucene query 的話，會找到不到。

```
created_at: [2018-08-07T17:00:22 TO 2018-08-07T18:00:22]
```
一樣要和他說明你現在在什麼時區才可以找到。

```
created_at: [2018-08-07T17:00:22+08:00 TO 2018-08-07T18:00:22+08:00]
```

## 再來看看 ISO 標準的儲法

```
const streamName = 'mark-stream';

const test = {
  name: 'Mark III',
  age: 40,
  created_at: "2018-08-07T17:00:22Z" //這個時間已經有先加 8 個小時了,
};

putRecord(streamName, test, (err, res) => {
  console.log(err);
});
```

### 先單純的看 Elasticsearch 查找有沒有問題 ~ 

然後我們一樣先用 es 的 search 來找找。

```
POST _search
{
    "query": {
        "range" : {
            "created_at" : {
                "gt" : "2018-08-07T16:30:22" ,
                "lt" : "2018-08-07T17:30:22",
            }
        }
    },
    "sort": [
    {
      "created_at": "asc"
    }
  ]
}
```
然後發現 **找得到 !!!**

主要原因是我們直接是儲放固定的 ISO 時間，而不像是上面 timestamp 它會幫你先轉一下成 ISO 然後你在查找，它在幫你轉時，會轉成 +0 的時間，所以才會找不到。

### 再來看看 kibana 內的顯示與查找有沒有問題 ~ 

#### 首先 kibana 內顯示會有問題 !

首先你只會看到下面這個資料，注意我們上面儲的是`2018-08-07T17:00:22Z`，WTF 為啥kibana 顯示變成`2018-08-08T01:00:22.22`。

問題在於 kibana 認為 Elasticsearch 裡所儲放的時間區段為`+0`，所以到了 kibana 預設會判斷你的 browser 設定那個時區，然後咱們這是台灣所以會自動的轉換成:

> 2018-08-07T17:00:22Z + 8 h = 2018-08-08T01:00:22.22

```
name:Mark III 
age:40 
created_at: 2018-08-08T01:00:22.22 
_id:49585877623136865488831537954762517193201839360268304386.0 _type:log 
_index:api 
_score:1
```

#### 搜尋沒問題 !

```
created_at: [2018-08-07T16:30:22 TO 2018-08-07T17:30:22]
```

#### 那要如何顯示的問題呢 ? 

建立在 elasticsearch 時，儲 ISO 時和他說時間區段，如下，注意多了`+08:00`。

```
const streamName = 'mark-stream';

const test = {
  name: 'Mark III',
  age: 40,
  created_at: "2018-08-07T17:30:22+08:00" //這個時間已經有先加 8 個小時了,
};

putRecord(streamName, test, (err, res) => {
  console.log(err);
});
```
然後不論是在 elasticsearch 或 kibana 搜尋時，時間都要多加時間區段:

```
created_at: [2018-08-07T16:30:22+08:00 TO 2018-08-07T17:30:22+08:00]
```

```
POST _search
{
    "query": {
        "range" : {
            "created_at" : {
                "gt" : "2018-08-07T16:30:22+08:00" ,
                "lt" : "2018-08-07T17:30:22+08:00",
            }
        }
    },
    "sort": [
    {
      "created_at": "asc"
    }
  ]
}
```

## 結論
基本上如何一開始就選擇儲 timestamp 那後來只要在查找時，標示你現在是在那個時區，那就都可以搜尋到。但是如果一開始就要儲 ISO 標準時，就要用上面的儲法，這樣在 es 與 kibana 才能查找到你需要的資料。

順到說一下，我一開始選擇時會選擇 ISO 標準有以下幾個原因:

1. 服務沒有多時區的問題。
2. 希望 es 中儲放 iso 標準，有助於直接尋找時，可以很容易知道他的時間點，不需要在透過 kibana 或其它工具來轉換顯示。
3. 因為同時間還有一份 log 會儲放到 s3，如果是儲 timestamp 我們使用 athena 查找後的顯示，也很難看，而且如果是將檔案抓下來用 grep，就更麻煩了。
