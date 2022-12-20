/*
チャットボットのDBバックエンド

チャットボットのスクリプト、主記憶、状態を保持する。

チャットボットのニックネーム、ユーザの好きなもの、など会話を通じて
得られた記憶を永続的に保持する。botごとに記憶を区別するため、
chatbot.jsonのurlなどをbotIdとして与える。

この情報はdecoderやencoderでタグ展開に使われる。
replace関数内で再帰的に使われるため、メモリ内にデータのキャッシュを保持する。


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

import Dexie from "dexie";

class dbio {
  constructor() {
    this.chatbotId = undefined;
    this.url = "";
    this.db = null;
    this.cache = {};
  }

  async open(url) {
    // url: チャットボットのurl。urlが同じなら同一のチャットボットとみなす
    // dict: dbが空だった場合にdictの内容をputする。
    //       dictは{key:[vals], ...}という形式。

    if (!url) {
      throw new Error("urlが指定されていません");
    }
    if (this.url === url){
      return 
    }
    this.url = url;
    this.db = new Dexie('Biomebot');
    this.db.version(1).stores({
      chatbots: "++id, &url", // id, url 
      memory: "++id,[chatbotId+key]",  // id,botId,key,val 
      state: "chatbotId" // 
    });

    // chatbotsテーブルを調べてidがあればそれをthis.chatbotIdとする。
    // なければ新しくidを得る

    const data = await this.db.chatbots
      .where({ url: url })
      .toArray();

    if (data.length === 0) {
      this.chatbotId = await this.db.chatbots.add({ url: url });
    } else {
      this.chatbotId = data[0].id;
    }
  }

  async isMemoryEmpty(){
    console.assert(this.chatbotId, "DBがopenされていません");
    const count = await this.db.memory
      .where('[chatbotId+key]')
      .between([this.chatbotId, Dexie.minKey], [this.chatbotId, Dexie.maxKey])
      .count();

    return count === 0;
  }

  async getMemory() {

    console.assert(this.chatbotId, "DBがopenされていません");

    const items = await this.db.memory
      .where('[chatbotId+key]')
      .between([this.chatbotId, Dexie.minKey], [this.chatbotId, Dexie.maxKey])
      .toArray();

    if (items.length === 0) {
      return false;
    }

    let dict = {};
    for (let item of items) {
      dict[item.key] = [...item.values];
    }
    return dict;
  }

  async putsMemory(dict) {
    /*
       dictで与えられるデータを一括して書き込む
       dictは
       {
          key:[value, ...],...
       }
       という形式になっている。これをbulkAddに対応したリストに書き換える
    */

    console.assert(this.chatbotId, "DBがopenされていません");

    let data = [];
    for (let key in dict) {
      data.push({
        chatbotId: this.chatbotId,
        key: key,
        values: dict[key]
      });
    }

    await this.db.memory.bulkAdd(data);
    this.cache = { ...dict }
  }

  addMemoryItem(key, value) {
    /* 
       keyにvalueを追加する。
       既にkeyにvalueが存在する場合、既存のvalueは温存される。
       cacheを介することでsync呼び出しが可能になり遅延を避ける
    */

    (async () => {
      let prev = await this.db.memory
        .where({ chatbotId: this.chatbotId, key: key })
        .first();

      if(prev){
        await this.db.memory.put({
          id: prev.id,
          chatbotId: this.chatbotId,
          key:key,
          values: [...prev.values, value]
        })
      } else {
        await this.db.memory.put({
          chatbotId: this.chatbotId,
          key:key,
          values: [value]
        })
      }
    })();

    if (key in this.cache){
      this.cache[key].push(value);
    } else {
      this.cache[key] = [value];
    }
    
  }
  setMemoryItem(key, value) {
    /*
      keyにvalueを格納する。
      既にvalueが存在する場合、既存のvalueは削除される。
      cacheを介することでsync呼び出しが可能になり遅延を避ける
    */

    (async () => {
      let prev = await this.db.memory
        .where({chatbotId:this.chatbotId,key:key})
        .first();
        
      await this.db.memory.update(
        prev.id,{
        values: [value]
      });
    })();

    this.cache[key] = [value];
  }
}

export const db = new dbio();