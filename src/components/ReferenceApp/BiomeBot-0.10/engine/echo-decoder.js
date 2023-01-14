/*
Echo dncoderクラス
----------------------------

# 概要

スクリプトの"out"に書かれた出力文字列を記憶する。
encoder.retrieve()が出力する内部コードを与えると、
出力文字列候補からランダムに一つを選んで返答とする。

# スクリプト

{
  "script": [
    {
      "in": ["入力文字列1","入力文字列2", ...],
      "intent": 意図文字列
      "out": ["出力文字列候補1","出力文字列候補2",...]
    },
    ...
  ]
}

ここで
code={
  intent: 意図文字列
  index: 辞書の行番号
  score: 類似度　// 無視
  status: "ok" or エラーメッセージ　
}

intentが*以外の非空文字列だった場合、それを辞書から探して
該当する行を出力する。intentが無効ならindexで指定された行の
候補の中から一つを選んで出力する

# 使用法

let echoDecoder = new EchoDecoder(script);

echoDecoder.learn(script); // スクリプトを学習させる

const text = echoDecoder.render(code); // textを内部コードとスコアに変換


*/

import { randomInt } from "mathjs";
import { InvalidScriptException } from './exceptions.js';
import { db } from '../../db';

const RE_MAIN_TAG = /{[A-Z_][A-Z0-9_]*}/g;

export default class EchoDecoder {

  constructor(script) {
    this.outScript = [];
    this.intents = {};
    this.filename=script.filename;
    this.learn(script);
  }

  learn(script) {
    if (!("script" in script)) {
      throw new InvalidScriptException(
        `EchoDecoder: ${this.filename}のスクリプトはscriptという要素に含まれている必要があります`
      )
    }
    if ((!Array.isArray(script.script)) || script.script.length === 0) {
      throw new InvalidScriptException(
        `${this.filename}: スクリプトが空です`
      )
    }

    this.outScript = [];

    // outスクリプトの抽出
    const _script = script.script;

    for (let i = 0, l = _script.length; i < l; i++) {
      let line = _script[i];
      if ('out' in line && Array.isArray(line.out) && line.out.length !== 0) {
        this.outScript.push(line.out);
      }
      else {
        throw new InvalidScriptException(
          `${this.filename}: ${i}行のoutがないか、形式が正しくありません`
        )
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


    return { status: "ok" };
  }

  render(code) {
    /* code={intent: string, index: number, score: number, status: string } */

    if (code.status !== 'ok') {
      return code.status;
    }

    let cands;

    if (code.intent && code.intent !== "" && code.intent !== "*") {
      if (code.intent in this.intents) {
        cands = this.outScript[this.intents[code.intent]]
      } else {
        cands = [`error: 辞書にないintent "${code.intent}"が指定されました`]
      }
    } else {
      cands = this.outScript[code.index];
    }

    let cand = cands[randomInt(cands.length)];

    // candに含まれるタグをテキストに戻す
    console.log("cand",cand)
    return cand.replace(RE_MAIN_TAG, (whole, itemTag) => this.expand(itemTag));
  }

  expand(tag) {
    /* 
    タグ文字列を再帰的に展開する。
    {CAPITAL}はメイン辞書のタグを置き換える。
    {non_capital}は同じ辞書の中から候補を探して展開する
    */
    if (!db.isExist(tag)) return tag;

    let vals = db.getMemoryValues(tag);
    let val = vals[randomInt(vals.length)];

    return val.replace(RE_MAIN_TAG, (whole, itemTag) => this.expand(itemTag))
  }
}