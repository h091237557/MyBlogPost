# 如何使用 AWS athena 去尋找 S3 的資料(plus kinesis 丟到 S3 的坑)

在筆者的[一個基於 AWS Elasticsearch 的用戶行為 log 系統建立
](http://marklin-blog.logdown.com/posts/7801415-establishment-of-a-log-system-based-on-aws-elasticsearch)中，我們建立了一個使用者行為分析的 log 系統，文章中有提到，我們會將比較舊的 log 放置到 S3 中，所以本篇文章我們將要學習的主題為:

> 如何時用 AWS Athena 來尋找 S3 中的資料

另外本篇另一個外傳也要順到說一下，這外傳的主題為:

> 使用 AWS Kinesis 丟 json 資料到 S3 ，你會總是只能 query 到一行資料 ! 

接下來下面為本篇章節:

* AWS Athena 的簡單介紹
* 使用 AWS Athena 將 S3 的檔案建立成類似 SQL 的 Table
* 使用 AWS Athena 來進行 query (日期區間、指定欄位、大小數量) 
* 坑 ! 使用 AWS Kinesis 丟 json 資料到 S3 ，你會總是只能 query 到一行資料 ! 

## AWS Athena 的簡單介紹
簡單的白話文說一下 AWS Athena 是啥:

> 它可以讓我們使用 SQL 來去 S3 搜尋你要的資料 

> 它的收錢機制是，你下的 SQL 去掃描了多少資料，來決定你要付多少 $$ (所以 query 請下準確，不要讓它去掃多於的資料)
> 
> 它似乎有索引的機制，但很貴 !

接下來我們將簡單的說明操作方式。

## 使用 AWS Athena 將 S3 的檔案建立成類似 SQL 的 DB 與 Table

### 第一步: 建立 DB
在 query 欄位裡面輸入以下的 sql。

```
CREATE DATABASE markDB
```
執行結果如下，然後你就會看到左邊有個 markDB 的選項。

![](http://yixiang8780.com/outImg/20180704-01-athena-basic.png)

### 第二步: 建立 Table


首先我們 S3 的測試檔案內容如下:

```
{"name":"Mark","age":20,"created_at":"2018-07-03T15:08:43.626Z","fans":[{"name":"Ian"},{"name":"Jack"}]}
{"name":"Mark II","age":30,"created_at":"2018-07-03T15:09:13.416Z","fans":[{"name":"Mary"},{"name":"John"}]}
{"name":"Mark III","age":40,"created_at":"2018-07-03T15:09:56.975Z","fans":[{"name":"Mary"},{"name":"Baba"}]}
```

```
格式
{
  name: <string>,
  age: <integer>,
  created_at: <string> (iso 日期格式)
  fans: [
    name: <string>
  ]
}

```

然後我們要先進入到 Athena 頁面裡，根據上述的檔案內容，建立一個 Table。其中比較需要注意的為`ROW FORMAT SERDE`，這個就是我們的檔案解析器，假設你的檔案是存 csv 格式的，那這裡就需要更換。

```
CREATE EXTERNAL TABLE IF NOT EXISTS markdb.user (
  `name` string,
  `age` int,
  `created_at` string,
  `fans` array<struct<name:string>> 
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
WITH SERDEPROPERTIES (
  'serialization.format' = '1'
) LOCATION 's3://marklin-s3/api2018/'
TBLPROPERTIES ('has_encrypted_data'='false');
```
然後建立好後，你可以直接下達下面的 sql 來看看有沒有資料:

```
SELECT * FROM user
```
結果如下圖:

![](http://yixiang8780.com/outImg/20180704-02-athena-basic.png)

## 使用 AWS Athena 來進行 query (日期區間、指定欄位、大小數量) 

接下來，我們來根據常用的情況，來看看在 Athena 要如何搜尋到你要的資料，事實上就只是下下 SQL 而以。

[更多的操作符號請參閱此篇文章](https://docs.aws.amazon.com/zh_cn/athena/latest/ug/functions-operators-reference-section.html)

### 馬克大想要從 S3 中尋找日期為 20170703-15:09:01 以後所建立的 user 資料，要如何下呢 ? 

如下，這裡我說明一下，為什麼我這裡用`from_iso8601_timestamp`，主要的原因在於我的日期格式是存 iso 格式，也就是長這樣`"2018-07-03T15:09:56.975Z"`，在 Athena 中，如果你要使用 iso 格式來當你的格式，那有以下兩個地方要注意:

* 在 create table 時你的欄位要設成`string`不能用`Date or Timestamp`。
* 在 query 時，你要用`from_iso8601_timestamp`來將 string 轉成 timestamp 來進行搜尋。

```
SELECT * FROM user 
WHERE from_iso8601_timestamp(created_at) > from_iso8601_timestamp('2018-07-03T15:09:00Z')
```
### 馬克大想要找 fans 中有 Ian 的 user 要如何下呢 ?

```
SELECT * FROM user 
CROSS JOIN UNNEST(fans) AS t(fan)
WHERE fan.name = 'Ian'
```

### 馬克大想要找 user 中 age 大於20與小於40歲的 user 資料，要如何下呢 ?

```
SELECT * FROM user 
WHERE age BETWEEN 25 AND 35 
```

## 坑 ! 使用 AWS Kinesis 丟 json 資料到 S3 ，你會總是只能 query 到一行資料 ! 

事情是這樣，我這裡都是使用以下的方式來將資料丟到 S3。

```
資料來源(json) -> AWS kinesis -> S3
```
然後呢我每一次在 AWS Athena 下 query (table 用上面的 script 建立)時，都會發現每一次下抓全部資料的 query 時都只有第一筆資 !

後來調查了一下，我發現 Kinesis 幫我送到 S3 時，產生的檔案如下:

```
{ name: 'Mark', age: 20 }{ name: 'Ian', age: 30 }
```
然後這份[文件](https://aws.amazon.com/tw/premiumsupport/knowledge-center/error-json-athena/)中，下面這段話有說到，每一個 json 記錄都只能單一行 !

```
Be sure your JSON record is on a single line

Athena doesn't currently support multi-line JSON records.
```
Fuc u ! 所以正確能解析的格式是應該要如下:

```
{ name: 'Mark', age: 20 }
{ name: 'Ian', age: 30 }
```
> 我最想罵的就是是 AWS kinesis 自已幫我儲的，明知 Athena 有這規則，卻不來個換行。

所以呢，最後為了要解決這個問題，我就只到在每一次丟的 json string 都加了一個`\n`。不要笑 ~ 連我在 Amazon 工作的同事聽到都直接噴飯，都說是 bug 吧。

```
JSON.stringify(data) + '\n'
```
喔對了，上面是在資料來源時加個換行，如果你覺得資料來源很多，懶的在這加，那就只能使用 AWS lambda 來進行處理，就有點像下面這流程:

```
資料來源 -> AWS kinesis -> AWS lambda(加換行) -> S3
```
有時我在懷疑，是不是 AWS lambda 的收錢策略呢?

## 參考資料
[AWS Athena 用戶指南](https://docs.aws.amazon.com/zh_cn/athena/latest/ug/json.html)



