/*
Harvest Decoderクラス
---------------------------------------

# 概要

スクリプトの"out"に書かれた出力文字列を記憶する。
HarvestEncoder.retrieve()で得られた内部コードを与えると、出力
文字列候補からランダムに一つを選んで返答とする。

この内部コードにはharvestが格納されており、harvestは[surf,type]
という形式で格納されている。出力文字列の中に「*」という文字列が
含まれていたら、それを指定された文字列に置き換える。
置き換える際にはPhraseSegmenterで出力文字列を分割し、*の属する
文節の種類を取得する。

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

let harvestDecoder = new HarvestDecoder();

harvestDecoder.learn(script); // スクリプトを記憶させる

const text = harvestDecoder.render(code); // textを内部コードとスコアに変換

codeは以下の情報で構成される
{
  score: 類似度の最大値,
  index: 類似度が最大だった行番号（注：リストではない）
  harvest: 入力から抽出された文字列 （注：リストではない）
  status: "ok" or "error",
  message: エラーの場合エラーメッセージの文字列が渡される
}
*/

import { randomInt } from "mathjs";
import EchoDecoder from "./echo-decoder";
import { db } from './dbio';

const RE_TAG = /\*/g;

export default class HarvestDecoder extends EchoDecoder {

  learn(script) {
    super.learn(script);
  }

  render(code) {
    if (code.status === 'error') {
      return code.message;
    }
    const cands = this.outScript[code.index];
    let cand = cands[randomInt(cands.length)];

    // 「*」をとりあえず先頭のharvestで置き換える。
    let harvest = "";
    if (code.harvests !== undefined && code.harvests.length !== 0) {
      harvest = code.harvests[0][0]
    }
    cand = cand.replace(RE_TAG, harvest)

    /*
      %~%タグを文字列に戻す。
      複数の候補がある場合はその中からランダムに選んだ一つを用いる。
      %bot_name%にニックネームを追加した場合、ランダムに選ぶか？
    */
    cand = cand.replace(/%[a-zA-Z0-9_+]%/g, (match) => {
      (async () => {
        const arr = await db.getItems(match);
        if (arr.length === 0) {
          const key = match.slice(1, -1);
          return `**error:"% ${key} %"が見つかりません**`
        }
        cand = arr[randomInt(arr.length)]
      })();
    })

    return cand;
  }

}