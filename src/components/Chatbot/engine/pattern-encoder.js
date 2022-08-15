/*
pattern encoderクラス
-----------------------------------

# 概要

正規表現で書かれたIN文字列に対してmatchするかどうかを計算し、
一致した中の一つを返す。類似度は一致したINがあれば1、なければ0を返す。
INの中に後方参照()が含まれていた場合、それを抽出してharvestsに格納する。
また複文処理のため、retrieveで検索に一致した部分を除去するchompオプションがある。

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

import {
  randomInt
} from "mathjs";

import { InvalidScriptException } from './exceptions.js';

export default class PatternEncoder {

  constructor() {
    this.script = [];
    this.index = [];
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

    // inスクリプトの抽出

    for (let i = 0, l = _script.length; i < l; i++) {
      let line = _script[i];
      if ('in' in line && Array.isArray(line.in) && line.in.length !== 0) {
        inScript.push(line.in);
      }
      else {
        throw new InvalidScriptException(`${i}行のinの形式が正しくありません`)
      }
    }

    // 正規表現化

    for (let i = 0, l = inScript.length; i < l; i++) {
      for (let text of inScript[i]) {
        this.script.push(new RegExp(text));
        this.index.push(i);
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

  retrieve(text, chomp=false) {
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

  resolve(text, chomp=false) {

    const check = this._precheck();
    if (check.status !== 'ok') return check;
    
    // 正規表現のマッチした行はスコア1とする
    // 後方参照があれば保持する
    let matches={};
    let match;

    for(let i=0,l=this.script.length; i<l; i++){
      match = this.script[i].exec(text);
      if(match){
        matches.push({
          index: i,
          backRefs:match.slice(1,match.length)
        })
      }  
    }

    if(matches.length === 0){
      return {
        index: null, score:0,
        status: "ok",
        text: text,
      }
    }

    let i = randomInt(matches.length);

    return {
      index:  this.index[matches[i].index],
      score: 1,
      harvests: matches[i].backRefs,
      text: chomp ? text.replace(this.script[i],"") : text
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

