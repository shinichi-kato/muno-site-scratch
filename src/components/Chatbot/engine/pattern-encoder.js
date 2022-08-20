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
    },
    {
      intent: "u_*",
      in: ["*"],
    }

正規表現 * はあらゆる入力にマッチするため辞書の末尾に置く。


# 使用法

let ptnEncoder = new PatternEndocer();

ptnEncoder.learn(script); // スクリプトを読み込む

code = ptnEncoder.retrieve(text, chomp); 

codeは以下の内容になる
{
  index: スクリプト中でヒットした行番号,
  score: 1,
  harvests: その行の正規表現に()があれば抽出内容が格納される,
  text: chompがtrueだった場合、正規表現にマッチした部分を除去したtextが渡される
}
*/

import { IntegrationInstructions } from "@mui/icons-material";
import {
  randomInt
} from "mathjs";

import { InvalidScriptException } from './exceptions.js';

export default class PatternEncoder {

  constructor() {
    this.script = [];
    this.intents = [];
  }

  // -----------------------------------------------------
  //
  // スクリプトの記憶
  //
  // ----------------------------------------------------

  learn(script) {

    if (!("script" in script)) {
      throw new InvalidScriptException(
        "スクリプトはscriptという要素に含まれている必要があります"
      )
    }
    if ((!Array.isArray(script.script)) || script.script.length === 0) {
      throw new InvalidScriptException(
        "スクリプトが空です"
      )
    }
    const _script = script.script;
    let inScript = [];
    let intents = [];

    // in-intentスクリプトの抽出

    for (let i = 0, l = _script.length; i < l; i++) {
      let line = _script[i];
      if ('in' in line && Array.isArray(line.in) && line.in.length !== 0) {
        inScript.push(line.in);
        intents.push(line.intent);
      }
      else {
        throw new InvalidScriptException(`${i}行のinの形式が正しくありません`)
      }
    }

    // 正規表現化

    for (let i = 0, l = inScript.length; i < l; i++) {
      for (let text of inScript[i]) {
        this.script.push(new RegExp(text));
        this.intents.push(intents[i])
      }
    }
  }

  // ----------------------------------------------------
  //
  // 類似テキストの検索
  // __start__のようなコマンドも通常の文字列として扱われる
  // text: 入力文字列
  // chomp: 入力文字列のうち、検索にヒットした部分を
  //        除去した文字列も返す
  //
  // ---------------------------------------------------- 

  retrieve(text, chomp = false) {
    text.replace('_', '＿');
    return this.resolve(text, chomp);
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
        return {
          intent: this.intents[i],
          score: 1,
          harvests: match.slice(1, match.length),
          text: chomp ? text.replace(match[0], "") : text,
          status: "ok",
        }
      }
    }

    return {
      intent: null,
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
}

