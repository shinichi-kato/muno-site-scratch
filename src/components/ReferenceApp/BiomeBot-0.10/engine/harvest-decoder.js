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

const RE_MAIN_TAG = /{[A-Z_][A-Z0-9_]*}/g;

export default class HarvestDecoder extends EchoDecoder {

  learn(script) {
    super.learn(script);
  }

  render(code) {
    if (code.status === 'error') {
      return code.message;
    }

    let cands;
    
    console.log("code",code)

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

    console.log("cand",cand)

    /*
      タグを文字列に戻す。
      複数の候補がある場合はその中からランダムに選んだ一つを用いる。
      取得した名前は{LAST}に、それを含めた全ての名前は{BOT_NAME}に格納されている。

    */
    return cand.replace(RE_MAIN_TAG, (itemTag) => this.expand(itemTag));
  }

}