/*
pattern encoderクラス
-----------------------------------

# 概要
正規表現で書かれたIN文字列に対してmatchするかどうかを辞書に記述された
順番で調べ、最初に一致したものを返す。類似度は一致したINがあれば1、
なければ0を返す。
INの中に後方参照()が含まれていた場合、それを抽出してharvestsに格納する。
また複文処理のため、retrieveで検索に一致した部分を除去するchompオプションがある。

pattern encoderでは辞書の形式はin-outではなくin-intentとし、codeにはindexではなく
intentを格納する。
    {
      intent: "summon",
      in: ["^ねえ(.+?)さん"],
      out: ["こんにちは！"]
    },
    {
      in: ["入力正規表現1"],
      out: ["出力文字列候補1"]
    }

## 辞書



# 使用法

let ptnEncoder = new PatternEndocer(script);

ptnEncoder.learn(script); // スクリプトを別途読み込む場合はこちら

code = ptnEncoder.retrieve(inputCode, chomp); 

codeは以下の内容になる
{
  intent: 意図を示す文字列
  index: スクリプト中でヒットした行番号,
  score: 1,
  harvests: その行の正規表現に()があれば抽出内容が格納される,
  text: chompがtrueだった場合、正規表現にマッチした部分を除去したtextが渡される
}
*/

import { InvalidScriptException } from './exceptions.js';
import { db } from '../../db';

export default class PatternEncoder {

  constructor(script) {
    this.script = [];
    this.index = [];
    this.intents = {};
    this.filename=script.filename;

    this.learn(script);
  }

  // -----------------------------------------------------
  //
  // スクリプトの記憶
  //
  // ----------------------------------------------------

  learn(script) {

    if (!("script" in script)) {
      console.log("script=",script)
      throw new InvalidScriptException(
        `${this.filename}: スクリプトはscriptという要素に含まれている必要があります`
      )
    }
    if ((!Array.isArray(script.script)) || script.script.length === 0) {
      throw new InvalidScriptException(
        `${this.filename}スクリプトが空です`
      )
    }
    const _script = script.script;
    let inScript = [];

    // inスクリプトの抽出

    for (let i = 0, l = _script.length; i < l; i++) {
      let line = _script[i];
      if ('in' in line && Array.isArray(line.in) && line.in.length !== 0) {
        inScript.push(line.in);
      }
      else {
        throw new InvalidScriptException(`${i}行のinの形式が正しくありません`)
      }

      // intents
      if ('intent' in line && typeof line.intent === 'string' && line.intent !== '*') {
        if (line.intent in this.intents) {
          throw new InvalidScriptException(
            `スクリプト中でintent "${line.intent}"が重複しています`
          )
        }
        this.intents[line.intent] = i
      }
    }


    // 正規表現化
    this.script = [];

    for (let i = 0, l = inScript.length; i < l; i++) {
      for (let text of inScript[i]) {
        this.script.push(new RegExp(text));
        this.index.push(i)
      }
    }
  }

  // ----------------------------------------------------
  //
  // 類似テキストの検索
  //
  // ---------------------------------------------------- 

  retrieve(code, chomp = false) {
    /* code={intent: string, text: string, owner: string}　*/

    // intentが設定されており'*'以外なら探してcodeとする
    let result = this._retrieveIntent(code);
    if (result !== false) {
      // 入力文字列に対してこのintentに対応する正規表現(inScript)を
      // 実行し、hitしたら後方参照文字列を取り出してreturnに含める

      // intentに対応するthis.indexを抽出
      return result
    }

    return this.resolve(code.text, chomp);
  }



  // ----------------------------------------------------
  //
  // 類似テキストの検索
  // __start__のような文字列がコマンドとして扱われる
  // chomp: 入力文字列のうち、検索にヒットした部分を
  //        除去した文字列も返す
  //
  // ----------------------------------------------------

  resolve(text, chomp = false) {

    const check = this._precheck();
    if (check.status !== 'ok') return check;
    
    // 正規表現のマッチした行はスコア1とする
    // 後方参照があればharvestに格納して返す

    let match;
    for (let i = 0, l = this.script.length; i < l; i++) {
      match = this.script[i].exec(text);
      if (match) {

        // i行のintentを探す
        let intent = '*';
        let i2 = this.index[i]
        for(let x in this.intents){
          if(this.intents[x] === i2){
            intent = x;
            break;
          }
        }
        console.log("text=",text,"intent=",intent,"index=",i2)
        // このiはthis.scriptの添字で
        // それをinscriptの添字に戻せてない
        return {
          intent: intent,
          index: i2,
          score: 1,
          harvests: match.slice(1, match.length),
          text: chomp ? text.replace(match[0], "") : text,
          status: "ok",
        }
      }
    }

    return {
      intent: null,
      index: null,
      score: 0,
      harvests: [],
      text: text,
      status: "ok",
    }
  }


  _precheck() {
    if (this.script.length === 0) {
      return {
        index: null, score: 0,
        status: "error",
        message: "スクリプトが読み込まれていません"
      };
    }
    return {
      status: 'ok'
    }
  }

  _tagging(text, key) {
    let vals = db.getMemoryValues(key);
    for (let val of vals) {
      text = text.replace(val, key);
    }
    return text;
  }

  _retrieveIntent(code) {
    // intentが設定されており'*'以外なら探してoutとする
    if (code.intent && code.intent !== "" && code.intent !== '*') {
      if (code.intent in this.intents) {
        return {
          intent: code.intent,
          index: this.intents[code.intent],
          score: 1,
          status: 'ok'
        }
      }
      return {
        intent: "*",
        index: null,
        score: 0,
        status: `辞書にない intent "${code.intent}"が使用されました`
      }
    }

    return false;
  }

}

