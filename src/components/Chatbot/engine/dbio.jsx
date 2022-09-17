/*
チャットボットの主記憶辞書 

チャットボットのニックネーム、ユーザの好きなもの、など会話を通じて
得られた記憶を永続的に保持する。botごとに記憶を区別するため、
chatbot.jsonのパス名などをbotIdとして与える。

この情報はdecoderやencoderでタグ展開に使われる。
replace関数内で再帰的に使われるため、メモリ内にデータのキャッシュを保持する。

*/

import { ThreeSixty } from "@mui/icons-material";
import Dexie from "dexie";

class dbio {
  constructor(){
    this.botId = undefined;
    this.db = null;
    this.cache = {};

  }

  initialize(botId, dict) {
    // botId: botごとにユニークな名前
    // dict: dbが空だった場合にdictの内容をputする。
    //       dictは{key:[vals], ...}という形式。

    if (!botId) {
      throw new Error("botIdが指定されていません");
    }

    this.db = new Dexie('Chatbot');
    this.db.version(1).stores({
      main: "++id,[botId+key]",  // id,botId,key,val 
    });

    // mainが空の場合dictで指定した内容を書き込みcacheに保持する
    // 空でない場合は内容を読み出しcacheに保持する

    const count = this.db.main
      .where('[botId+key]')
      .between([this.botId, Dexie.minKey], [this.botId, Dexie.maxKey])
      .count();

    (async () => {
      if (count === 0) {
        await this.putItems(dict);
        this.cache = { ...dict }
      } else {
        this.cache = await this.getItems();
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
      for (let vals in dict[key]) {
        data.push({
          botId: this.botId,
          key: key,
          values: vals
        });
      }
    }

    await this.db.main.bulkAdd(data);
  }

  addItem(key, value) {
    /* 
       keyにvalueを追加する。
       既にkeyにvalueが存在する場合、既存のvalueは温存される。
    */

    (async () => {
      let item = await this.db.main
        .where({ botId: this.botId, key: key })
        .first();
      if (item) {
        item.values.push(value);
        this.cache[key] = [...item.values];
      } else {
        await this.db.main.put({
          botId: this.botId,
          key: key,
          values: [value]
        });
        this.cache[key] = [value];
      }

    })();
  }

  getValues(key) {
    /*
       keyのvalueをcacheから読み出す。
       返り値はvalueのリストで、valueが存在しない場合[]を返す
    */

    return this.cache[key];
  }

}

export const db = new dbio();