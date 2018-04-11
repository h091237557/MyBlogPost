# Elasticserach 的快速上手

本篇文章中，我們將要很快速的學習以下幾個重點:

1. elasticsearch 的基本觀念。
1. 使用 docker 建立 elastisearch 服務。
2. 新增 document。
3. 取得 document。
4. 修改 document。
5. 搜尋 document。

## elasticsearch 的基本觀念

Elasticserach 是一種分散式的搜尋引擎，它非常適合用來處理大量資料的搜尋與分析，像 github 就是拿他來搜尋它們所有的程式碼，而且它也提供了豐富的 restful api 來給我們進行操作。

Elasticserach 有這和關聯式資料庫相似的結構，如下圖。

![](http://yixiang8780.com/outImg/20180411-01-elasticsearch.png)

所以假設我們要新增一筆在 kkbox 某一位員工的文檔會長的如下:

```
index: kkbox
type: employee

{
  id: 123
  name: ‘Mark’,
  age: 18
}
```

然後當我們要去 ES 尋找這筆資料時，就可以使用它提供的 Restful API 來直接尋找:

> GET 127.0.0.1:9200/kkbox/employee/123

## 使用 docker 建立 elastisearch 服務

接下來的教學可以直接用這個專案來直接執行:

```
git clone 

docker-compose up
```
下面為官網所直接使用的`docker compose`的檔案。([官網傳送門](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html))




```
version: '2.2'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.2.3
    container_name: elasticsearch
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - esdata1:/usr/share/elasticsearch/data
    ports:
      - 9200:9200
    networks:
      - esnet
  elasticsearch2:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.2.3
    container_name: elasticsearch2
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - "discovery.zen.ping.unicast.hosts=elasticsearch"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - esdata2:/usr/share/elasticsearch/data
    networks:
      - esnet

volumes:
  esdata1:
    driver: local
  esdata2:
    driver: local

networks:
  esnet:
```


以下有幾個配置要注意一下。

### environment

* cluster.name : 這個就是設定這個 ES cluster 的名稱，所有在相同機器上且命名相同 cluster.name 的都將在相同的 cluster 裡。
* bootstrap.memory_lock : 這個設定 true 是為了要防止 swapping 抓到 ES 的 memory 來用，導致節點不穩而脫離 cluster。[官網](https://www.elastic.co/guide/en/elasticsearch/reference/master/setup-configuration-memory.html) 
* ES_JAVA_OPTS: `-Xms512m -Xmx512m` 代表設定 ES 的最大與最小的 heap 空間為 512 mb。
* discovery.zen.ping.unicast.hosts: 這是為了讓此節點知道去連結 elasticsearch ( docker 節點 )。

### ulimits
這個參數就是可以設定 docker 容器的 ulimits 參數，其中官網這裡會設定 memlock，事實上我還在研究它。不過主要事實和上面的 bootstrap.memory_lock 的原因有關，待調查。

```
ulimits:
      memlock:
        soft: -1
        hard: -1
```
### 確保 Elasticsearch 有成功執行

請指定執行下面的執令，然後該會看到如下的資訊。

```
curl 127.0.0.1:9200

---
{
  "name" : "OcaPXYM",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "Cg2ogE6ETbOhSEh0E8m-3w",
  "version" : {
    "number" : "6.2.3",
    "build_hash" : "c59ff00",
    "build_date" : "2018-03-13T10:06:29.741383Z",
    "build_snapshot" : false,
    "lucene_version" : "7.2.1",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

## 新增與取得文檔
我們試這新增一筆 kkcorp 的一筆員工資料看看，上面有提到 ES 提供了 restful api 給我們操作，所以我們只要準備好員工資料的 json 檔。

```
{
  name: 'Mark',
  age: 18,
  habit: 'Cut someone' 
}
```
然後使用 curl 執行下面的指令就可以新增一筆資料到裡面囉。

```
curl -X POST -H "Content-Type: application/json" -d @./post.json 127.0.0.1:9200/kkcorp/employee

執行完的訊息
{"_index":"kkcorp","_type":"employee","_id":"Mmbls2IBnSbSo4fQfVml","_version":1,"result":"created","_shards":{"total":2,"successful":1,"failed":0},"_seq_no":0,"_primary_term":1}%

```
上面的指令重點有兩個，第一個就是`post`在 restful api 中就代表這`新增`的意思，然後第二個重點就是下面這段 uri ，它說明了這筆資料要新增的地點，kkcrop 就是 index 而 employee 就是 type 的意思。

```
127.0.0.1:9200/kkcorp/employee
```
然後我們就可以使用下面的 restful api 來取得該筆資料，其中 employee 後面的那個英文就是文檔 id。

```
curl 127.0.0.1:9200/kkcorp/employee/Mmbls2IBnSbSo4fQfVml?pretty

執行完結果
{
  "_index" : "kkcorp",
  "_type" : "employee",
  "_id" : "Mmbls2IBnSbSo4fQfVml",
  "_version" : 1,
  "found" : true,
  "_source" : {
    "name" : "Mark",
    "age" : 18,
    "habit" : "cut someone"
  }
}
```
## 更新文檔
更新文檔的方法也是相同的，使用 put 方法，然後在指定要更新誰就可以囉。

```
127.0.0.1:9200/kkcorp/employee/Mmbls2IBnSbSo4fQfVml
```


```
curl -X PUT -H "Content-Type: application/json" -d @./update.json 127.0.0.1:9200/kkcorp/employee/Mmbls2IBnSbSo4fQfVml?pretty

{
  "_index" : "kkcorp",
  "_type" : "employee",
  "_id" : "Mmbls2IBnSbSo4fQfVml",
  "_version" : 3,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "failed" : 0
  },
  "_seq_no" : 2,
  "_primary_term" : 1
}
```

## 搜尋文檔
假設我們現在有兩筆資料。

```
{
  name: "Mark",
  age: 18,
  habit: "cut someone"
},
{
  name: "Ian",
  age: 18,
  habit: "hack someone"

}
```
然後我們現在要搜尋興趣為`cut`的員工，就執行下面的指令。

```
curl 127.0.0.1:9200/kkcorp/employee/_search?q=habit:'cut'

---
執行結果

{
    "took": 146,
    "timed_out": false,
    "_shards": {
        "total": 5,
        "successful": 5,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": 1,
        "max_score": 0.2876821,
        "hits": [
            {
                "_index": "kkcorp",
                "_type": "employee",
                "_id": "YGYhtGIBnSbSo4fQe2Lh",
                "_score": 0.2876821,
                "_source": {
                    "name": "Mark",
                    "age": 18,
                    "habit": "cut someone"
                }
            }
        ]
    }
}

```
上面的搜尋是最最基本的搜尋，elasticserach 他提供了非常強大的分析與搜尋工具，將留到下一篇文章中來說明。


