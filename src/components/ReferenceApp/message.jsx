/*
Messageクラス
=====================
発言や環境の変化などの学習対象を格納する。

使用法
  ## ユーザの発言
  const msg = new Message("speech",{
    text: "こんにちは",
    name: "しまりす",
    person: "user",
    mood: "peace", // 省略可, デフォルト "peace"
    avatarURL: "static/avatar/person.svg"
  });

  発言時刻は自動で付与される。

  ## チャットボットの発言
  const msg = new Message("speech",{
    text: "やっほー",
    name: "しずく",
    person: "bot",
    mood: "cheer", // 省略可, デフォルト "peace"
    avatarURL: "/chatbot/shizuku/"
  });

  ## システムメッセージ
  const msg = new Message("system",{
    text: "シマリスが退室しました"
  })

*/

export class Message {
  constructor(mode, data) {
    this.text = "";
    this.name = "";
    this.timestamp = null;
    this.avatarURL = "";
    this.backgroundColor = "";
    this.mood = "";
    this.person = "";
    this.id = Date.now();

    if (data === undefined) {
      if (isObject(mode)) {
        // 第一引数にオブジェクトを与えた場合、
        // そのオブジェクトをコピー
        for (let key in mode) {
          this[key] = mode[key]
        }
      }
    } else if(mode === 'speech'){
      this.text = data.text;
      this.name = data.name;
      this.timestamp = new Date();
      this.avatarURL = data.avatarURL;
      this.backgroundColor = data.backgroundColor;
      this.person = data.person;
      this.mood = data.mood;

    }
    else if (isObject(data)) {
      // そのオブジェクトをコピー
      for (let key in data) {
        this[key] = data[key]
      }
    }
    else {
      this.text ="Messageの形式が正しくありません"
    }
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object'
}