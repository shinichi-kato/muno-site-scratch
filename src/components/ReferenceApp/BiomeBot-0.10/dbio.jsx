/*
チャットボットの主記憶辞書 

チャットボットのニックネーム、ユーザの好きなもの、など会話を通じて
得られた記憶を永続的に保持する。botごとに記憶を区別するため、
chatbot.jsonのパス名などをbotIdとして与える。

この情報はdecoderやencoderでタグ展開に使われる。
replace関数内で再帰的に使われるため、メモリ内にデータのキャッシュを保持する。


*/

import Dexie from "dexie";

class dbio {
  constructor() {
    this.botId = undefined;
    this.db = null;
    this.cache = {};
  }

  async initialize(botId, dict) {
    // botId: botごとにユニークな名前
    // dict: dbが空だった場合にdictの内容をputする。
    //       dictは{key:[vals], ...}という形式。

    if (!botId) {
      throw new Error("botIdが指定されていません");
    }
    this.botId = botId;
    this.db = new Dexie('Chatbot');
    this.db.version(1).stores({
      main: "++id,[botId+key]",  // id,botId,key,val 
    });

    // mainが空の場合dictで指定した内容を書き込みcacheに保持する
    // 空でない場合は内容を読み出しcacheに保持する

    const count = await this.db.main
      .where('[botId+key]')
      .between([this.botId, Dexie.minKey], [this.botId, Dexie.maxKey])
      .count();

    console.log("count", count)
    if (count === 0) {
      await this.putItems(dict);
      this.cache = {...dict};

    } else {
      this.cache = await this.getItems();
    }

  }

  async putItems(dict) {
    /*
       dictで与えられるデータを一括して書き込む
       dictは
       {
          key:[value, ...],...
       }
       という形式になっている。これをbulkAddに対応したリストに書き換える
    */
    let data = [];
    for (let key in dict) {
      data.push({
        botId: this.botId,
        key: key,
        values: dict[key]
      });
    }

    await this.db.main.bulkAdd(data);
    this.cache = { ...dict }
  }

  addItem(key, value) {
    /* 
       keyにvalueを追加する。
       既にkeyにvalueが存在する場合、既存のvalueは温存される。
       cacheを介することでsync呼び出しが可能になり遅延を避ける
    */

    (async () => {
      let prev = await this.db.main
        .where({ botId: this.botId, key: key })
        .first();

      if(prev){
        await this.db.main.put({
          id: prev.id,
          botId: this.botId,
          key:key,
          values: [...prev.values, value]
        })
      } else {
        await this.db.main.put({
          botId: this.botId,
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

  setItem(key, value) {
    /*
      keyにvalueを格納する。
      既にvalueが存在する場合、既存のvalueは削除される。
      cacheを介することでsync呼び出しが可能になり遅延を避ける
    */

    (async () => {
      let prev = await this.db.main
        .where({botId:this.botId,key:key})
        .first();
        
      await this.db.main.update(
        prev.id,{
        values: [value]
      });
    })();

    this.cache[key] = [value];
  }

  async getItems() {
    const items = await this.db.main
      .where('[botId+key]')
      .between([this.botId, Dexie.minKey], [this.botId, Dexie.maxKey])
      .toArray();
    
    let dict = {};
    console.log("got items", items)
    for (let item of items) {
      dict[item.key] = [...item.values];
    }
    return dict;
  }

  getValues(key) {
    /*
       keyのvalueをcacheから読み出す。
       返り値はvalueのリストで、valueが存在しない場合[]を返す
    */

    return this.cache[key] || [];
  }

  isExist(key){
    return key in this.cache;
  }

}

export const db = new dbio();