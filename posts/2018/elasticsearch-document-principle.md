
在這一篇文章中，我們將要理解兩個問題 : 

1. 在新增一個 document 時，會建立 json 實體與索引，那這兩個東東會存放到那兒去 ?
2. 而在建立索引時，它又存放了什麼東東 ?

在開始前，我們先簡單的複習一下 Elasticsearch 的基本觀念。

## Elasticsearch ( ES ) 的前提觀念概要

Elasticsearch 是一種分散的搜尋引擎，它也有和關聯式資料庫相似的結構，如下圖。

![](http://yixiang8780.com/outImg/20180411-01-elasticsearch.png)

所以假設我們要新增一筆 document 應該是會長的像下面這樣。

> POST /kkbox/employee (/(index)/(type))
>
> 上面這行的語意就是新增一筆 document 到 kkbox (index) 的 employee 類別 
> (type)

```
{
  id: 123
  name: ‘Mark’,
  age: 18
}
```

然後當我們要去 ES 尋找這筆資料時，就可以使用它提供的 Restful API 來直接尋找:

> GET 127.0.0.1:9200/kkbox/employee/123



在有了簡單的基本概念後接下來就可以來尋找我們這篇文章的問題。

## 新增一個 document 時資料會存放到那 ??

像我們上面已經建立好了 document ，那實際上在 ES 中它是存放在那呢 ?? 雖然我們上面說它是對應到 RDBMS 的概念，但實際存放的地方不是存放在 kkbox 這個資料庫下的 employee 表下。

嚴格來說它是存放在 kkbox 這個 index 裡面，並且它的類型是 employee 。

那 index 裡的實體 document 又是放在那裡呢 ??

答案是在`shards`裡，咱們可以執行下面的指定看到 index 底下有那些 shards 

```
curl 127.0.0.1:9200/api-io/_search_shards
```

那 shards 是什麼，不如我們先來說說為什麼要有 shards ，一個 index 有可能會存放大量的 document ，這時所有的 document 都存放在同一個地方，一定會產生硬體貧頸，所以為了解決這個問題 ES 提供了方法可以將 index 分散成塊，而這個塊就被稱為『 shards 』。

所以簡單的說 index 是由多個 shard 所組成，然後 document 會實際存放在 shards 中。

![](http://yixiang8780.com/outImg/20180411-02-elasticsearch.png)


然後不同的 shards 可能會存放在不同的節點上，而這裡指的節點就是指不同實體，你也可以先想簡單一點就是機器。

![](http://yixiang8780.com/outImg/20180411-03-elasticsearch.png)


上面這張圖就是 ES 的 Cluster 基本架構，每當有文檔要建立時，它會依據 index 有那些分片，然後來將它丟到『某一個』分片中，當然它有辦法指定到分片中，不過這不是該篇文章要討論的主題。

我相信有人看到上面那張圖時會想說，如果其中一個節點上天堂了，那不就代表那個節點的 document 都會找不到嗎 ? 沒錯 ~ 不過你想想你都想得到了，那開發 ES 的人會想不到嗎 ?? 

ES 的解法就是每一個節點除了存放你上面看到的分片，它事實上還多存放了其它節點的備份分片，如下圖，假設我們有三個節點，然後每個節點上面有一個分片和另一個分片的備份，而當節點 2 上天堂時，我們在節點 1 還有分片 2 的備份，所以還是可以找的到分片 2 的 document 。

![](http://yixiang8780.com/outImg/20180411-04-elasticsearch.png)


## 那它除了將 document 實體建立起來，還有建立什麼東西嗎 ??

有的，那就是建立一些索引(此索引不是上面說的 index )，來幫助我們更快速的搜尋到它。

而要理解它存了啥，那就要來理解理解 ES 的`倒排索引`，如下圖，它的方向就是 ES 要搜尋時跑的方向，它會先去 term index 中尋找某個東西，然後可以指到 term dictionary ，接下來在從 dictionary 可以找到指定的 posting list ，最後 posting list 裡面就列了，你要的 document 編號。

![](http://yixiang8780.com/outImg/20180411-06-elasticsearch.png)


接下來我們將從 posting list 開始來說起，以下為範例 documents 。


{
  id: 1,
  name: ‘Mark',
  age: 18
},
{
  id: 2,
  name: ‘Ack',
  age: 28
},{
  id: 3,
  name: ‘Ad'
  age: 17
}
{
  id: 4,
  name: ‘Ban'
  age: 28
}

### Posting List

上面的 documents 會被轉換下面的列表，所以如果 client 要搜尋 age 為 28 歲的，馬上就能找到對應的 2 與 3 號 document。

#### name

 Term | Posting List |
| ------ |:------:|
| Mark | 1 |
| Ack | 2 |
| Ad | 3 |
| Ban | 4 |

#### age

Term | Posting List |
| ------ |:------:|
| 18 | 1 |
| 17 | 3 |
| 28 | [2,4] |


### Term Dictionary 
上面搜尋的方法看試可以，但假設有成千上萬個 term 呢 ? 例如你 name 的 term 有好幾千萬筆，所以為了解決這個問題
ES 會將所有的 term 進行排序，這樣就可以使用二分搜尋法來達到 O(logn) 的時間複雜度囉。( 二分搜尋可參考哥的這篇文章 [傳送門](http://marklin-blog.logdown.com/posts/1731603))

所以 name 這個會變成下面像下面這張表一樣，有排序過的 term。

Term Dictionary | Posting List |
| ------ |:------:|
| Ack | 2 |
| Ad | 3 |
| Ban | 4 |
| Mark | 1 |

### Term Index
上面這些東西如果數量小時，放在記憶體內還行，但問題是如果 term 很多，導致 term dictionary 非常大的話，放在記憶體內會出事情的，所以 ES 的解法就是`Term Index `。

`Term Index` 本身就是像個樹，它會根據上面的 term dictionary 產生出樹如下圖:

![](http://yixiang8780.com/outImg/20180411-07-elasticsearch.png)


`Term Index` 基本上是存放在`記憶體`中，每當進行搜尋時會先去這裡尋找到對應的 index ，然後再根據它去硬碟中尋找到對應的 term dictionary 最後就可以成功的找到指定的 document 囉。

![](http://yixiang8780.com/outImg/20180411-08-elasticsearch.png)


## 結論
最後簡單的總結一下本篇文章所提的兩個問題的結論。

1 . 在新增一個 document 時，會建立 json 實體與索引，那這兩個東東會存放到那兒去 ?

Ans: 會存放到某一個 shard 中，而 shard 又存放在每個節點裡面。

2 . 而在建立索引時，它又存放了什麼東東 ?

Ans: 會建立三個東西分別為 Posting List 、Dictionary 與 Term Index ，其中前兩者是存放在硬碟中，而最後的 index 是存放在記憶體中。


## 參考資料
* [Elasticsearch 權威指南](https://es.xiaoleilu.com/index.html)
* [壹讀-時下最火搜尋引擎：ElasticSearch詳解與優化](https://read01.com/nxD57.html#.WsL-ZtNuZ7o)
* [Elasticsearch－基础介绍及索引原理分析-](http://blog.pengqiuyuan.com/ji-chu-jie-shao-ji-suo-yin-yuan-li-fen-xi/)