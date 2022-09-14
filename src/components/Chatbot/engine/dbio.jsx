/*
チャットボットの主記憶辞書 

チャットボットのニックネーム、ユーザの好きなもの、など会話を通じて
得られた記憶を永続的に保持する。botごとに記憶を区別するため、
chatbot.jsonのパス名などをbotIdとして与える。

*/

import Dexie from "dexie";

class dbio {
  constructor(botId) {
    if (botId) {
      this.initialize(botId);
    }
  }

  initialize(botId, obj) {
    /*
      DBを作り、objの内容で初期化する。
      DBが既に存在していた場合はobjで上書きしない。
      
    */

    if (!botId) {
      throw error("botIdが与えられていません")
    }

    this.db = new Dexie('Chatbot');
    this.db.version(1).stores({
      main: "++id,[botId+key]",  // id,botId,key,val 
    });

    this.botId = botId;

    (async () => {
      if (await this.db.main.count() === 0) {
        await this.putItems(obj)
      }
    })();
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
      for (let val in dict[key]) {
        data.push({
          botId: this.botId,
          key: key,
          value: val
        });
      }
    }

    await db.main.bulkAdd(data);
  }

  async addItem(key, value) {
    /* 
       keyにvalueを追加する。
       既にkeyにvalueが存在する場合、既存のvalueは温存される。
    */

    await this.db.main.put({
      botId: this.botId,
      key: key,
      value: value
    })
  }

  async getItems(key) {
    /*
       keyのvalueを読み出す。
       返り値はvalueのリストで、valueが存在しない場合[]を返す
    */

    const arr = await this.db.main
      .where({ botId: this.botId, key: key })
      .toArray();

    return arr;
  }

  async toArray() {
    /*
      main辞書の全アイテムをリストにして出力
    */
    return await this.db.main
      .where('[botId+key]')
      .between([this.botId, Dexie.minKey], [this.botId, Dexie.maxKey])
      .toArray();
  }
}

export const db = new dbio();