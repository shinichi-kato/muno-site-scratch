/*
チャットボットデータI/O

* config: チャットボットの基本設定

```
  config: {
    botId: "firebaseのIDやuuidライクな文字列",
    description: "チャットボットの説明"
    backgroundColor: "#87DEDE",
    avatarDir: "/chatbot/???/",
    initialCellOrder: [],
    keepAliveMin: 10,
  }
```
会話中に変化しないチャットボットの情報

* work:

``` 
  work: {
    updatedAt: string
    partOrder: []
    queue: []
    site: string
  }
```


// main: 
part: {

}

*/

import Dexie from 'dexie';

class Db {
  constructor(){
    this.db = new Dexie('Biomebot-0.10');
    this.db.version(1).stores({
      config: "botId"
    })
  }
}