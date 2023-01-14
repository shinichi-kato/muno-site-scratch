/*
チャットボットのDB I/O

チャットボットのスクリプト、主記憶、状態およびチャットボットが把握する
ユーザ情報などを保持する。

** テーブルの構成

*** chatbotsテーブル

| name | *   | 説明
| ---- | --- | 
| ++id | ○  | id pk
| &url | ○  | チャットボットのurl

チャットボットはurlが同じであれば同一人物とみなす。urlそのものをidにする
ことも可能だが、chatbotsテーブルでidを与える。

***  memoryテーブル

| name      | *   | 説明
|      ---- | --- | ---
| ++id      | ○  | id pk
| chatbotId | ○  | chatbots.id
| key       | ○  | 辞書のキー
| val       | --  | 辞書の値リスト

現状で以下のアイテムがある。
{BOT_NAME}: チャットボットの表示名
{BOT_NAME_SPOKEN}: チャットボットの呼び名、ニックネームなどのリスト
{ENTER}: このチャットボット開始時の状態リスト

この情報はdecoderやencoderでタグ展開に使われる。
replace関数内で再帰的に使われるため、メモリ内にデータのキャッシュを保持する。

*** usersテーブル (未実装)

| name      | *   | 説明
| ----      | --- | 
| ++id      | ○  | id pk
| name      | ○  | 名前

チャットボットが各ユーザの情報を記憶するときに使用するIDを与える。

*** settingsテーブル(未実装)
チャットボットのスクリプトを編集するため、内容を記憶する。




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
    if (this.url === url) {
      return
    }
    this.url = url;
    this.db = new Dexie('Biomebot-0.10');
    this.db.version(2).stores({
      chatbots: "++id, &url", // id, url 
      memory: "++id,[chatbotId+key]",  // id,botId,key,val 
      state: "chatbotId", // 
      users: "++id, &name"
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

    this.cache = await this.getMemory();
  }

  async isMemoryEmpty() {
    if (!this.chatbotId) {
      throw new Error("DBがopenされていません");
    }
    const count = await this.db.memory
      .where('[chatbotId+key]')
      .between([this.chatbotId, Dexie.minKey], [this.chatbotId, Dexie.maxKey])
      .count();
    console.log(count);

    return count === 0;
  }

  async getMemory() {

    if (!this.chatbotId) {
      throw new Error("DBがopenされていません");
    }

    const items = await this.db.memory
      .where('[chatbotId+key]')
      .between([this.chatbotId, Dexie.minKey], [this.chatbotId, Dexie.maxKey])
      .toArray();

    if (items.length === 0) {
      return {};
    }

    let dict = {};
    for (let item of items) {
      if (item.val) {
        dict[item.key] = [...item.val];
      }
    }
    return dict;
  }

  async appendMemoryItems(dict) {
    /*
    dictの内容をmemoryに追記する。
    与えられたkeyが既存の場合、dictのvalueと同じ要素はその個数を含め
    変更しない。
    */
    if (!this.chatbotId) {
      throw new Error("DBがopenされていません");
    }
    let newVals;
    for (let key in dict) {
      let item = await this.db.memory.get({ chatbotId: this.chatbotId, key: key });

      if (item && item.val) {
        // dict[key]の内容がvalに含まれていたらそれは重複して追加しない
        newVals = [...item.val];
        let dictVals = [...dict[key]];
        let p;
        for (let v of item.val) {
          p = dictVals.indexOf(v);
          if (p !== -1) {
            dictVals.splice(p, 1);
          }
          if (dictVals.length === 0) {
            break;
          }
        }
        newVals = [...item.val, ...dictVals];
        item = { ...item, val: newVals };
      } else {
        newVals = dict[key];
        item = { chatbotId: this.chatbotId, key: key, val: newVals }
      }

      await this.db.memory.put({ ...item });

      this.cache[key] = [...newVals];

    }

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

    if (!this.chatbotId) {
      throw new Error("DBがopenされていません");
    }

    let data = [];
    for (let key in dict) {
      data.push({
        chatbotId: this.chatbotId,
        key: key,
        val: dict[key]
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

      if (prev) {
        await this.db.memory.put({
          id: prev.id,
          chatbotId: this.chatbotId,
          key: key,
          val: [...prev.val, value]
        })
      } else {
        await this.db.memory.put({
          chatbotId: this.chatbotId,
          key: key,
          val: [value]
        })
      }
    })();

    if (key in this.cache) {
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
        .where({ chatbotId: this.chatbotId, key: key })
        .first();

      if (prev) {
        await this.db.memory.put({
          id: prev.id,
          key: key,
          chatbotId: this.chatbotId,
          val: [value]
        });
      } else {
        await this.db.memory.add({
          chatbotId: this.chatbotId,
          key: key,
          val: [value]
        })
      }

    })();

    this.cache[key] = [value];
  }

  getMemoryValues(key) {
    /*
       keyのvalueをcacheから読み出す。
       返り値はvalueのリストで、valueが存在しない場合[]を返す
    */

    return this.cache[key] || [];
  }

  isExist(key) {
    return key in this.cache;
  }

  getBotName() {
    console.assert(this.chatbotId, "DBがopenされていません");
    return this.cache['{BOT_NAME}'][0]
  }

  async getUserId(userName) {
    let id;
    const data = await this.db.users
      .where({ name: userName })
      .toArray();

    if (data.length === 0) {
      id = await this.db.users.add({ name: userName });
    } else {
      id = data[0].id;
    }

    return id;
  }
}

export const db = new dbio();