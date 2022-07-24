/*
Echo dncoderクラス
----------------------------

# 概要

スクリプトの"out"に書かれた出力文字列を記憶する。
encoder.retrieve()で得られた内部コードを与えると、
出力文字列候補からランダムに一つを選んで返答とする。

# スクリプト

{
  "script": [
    {
      "in": ["入力文字列1","入力文字列2", ...],
      "out": ["出力文字列候補1","出力文字列候補2",...]
    },
    ...
  ]
}


# 使用法

let echoDecoder = new EchoDecoder();

echoDecoder.learn(script); // スクリプトを記憶させる

const text = echoDecoder.render(code); // textを内部コードとスコアに変換

codeは以下の情報で構成される
{
  score: 類似度の最大値,
  index: 類似度が最大だった行番号のリスト
  status: "ok" or "error",
  message: エラーの場合エラーメッセージの文字列が渡される
}



*/

import { randomInt } from "mathjs";
import { InvalidScriptException } from './exceptions.js';

export default class EchoDecoder {

  constructor() {
    this.outScript = null;
  }

  status() {
    if (this.outScript === null) {
      return "unload"
    }
    return "ready"
  }

  learn(script) {
    if (!("script" in script)) {
      throw new InvalidScriptException(
        "decoder error:スクリプトはscriptという要素に含まれている必要があります"
      )
    }
    if ((!Array.isArray(script.script)) || script.script.length === 0) {
      throw new InvalidScriptException(
        "スクリプトが空です"
      )
    }

    this.outScript = [];

    // outスクリプトの抽出
    const _script = script.script;

    for (let i = 0, l = _script.length; i < l; i++) {
      let line = _script[i];
      if ('out' in line && Array.isArray(line.in) && line.in.length !== 0) {
        this.outScript.push(line.out);
      }
      else {
        throw new InvalidScriptException(
          `${i}行のoutの形式が正しくありません`
        )
      }
    }

    return { status: "ok" };
  }

  render(code) {
    if (code.status === 'error') {
      return code.message;
    }

    const cands = this.outScript[code.index];

    return cands[randomInt(cands.length)];
  }
}