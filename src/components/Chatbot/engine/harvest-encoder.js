/*
harvest encoderクラス
----------------------------

# 概要

Harvestエンコーダーは入力文字列を文節に分け、その順番を無視して単語ごとに数を
数える方法で文字列のベクトル化する。形態素ではなく文節を単位とすることで
文節レベルでの順序の融通性に対応しつつ必要な単語の抽出精度向上を図っている。

スクリプトを記憶したインスタンスに文字列を入力すると、スクリプトの中で
その文字列に最もよく似た行の番号リストと、類似度を表すscoreを返す。

# スクリプト

{
  "script": [
    {
      "in": ["入力文字列1","入力文字列2", ...],
      "intent": "greeting",
      "out": ["出力文字列候補1","出力文字列候補2",...]
    },
    ...
  ]
}

# 文節区切りの方法

pharase-segmenter参照


# 使用法

let bowEncoder = new BowEndocer();

bowEncoder.learn(script); // スクリプトを読み込む

// textを内部コードに変換。__start__のような
// コマンドも文字列として扱う。
code = bowEncoder.retrieve(text); 

// textを内部コードに変換
// __start__のようなコマンドが有効
code = bowEncoder.solve(string); 

codeは以下の情報で構成される
{
  score: 類似度の最大値,
  index: 類似度が最大だった行の番号（複数ある場合はランダムに選んだ一つ)
  status: "ok" or "error",
  message: エラーの場合エラーメッセージの文字列が渡される
}


*/

import { randomInt } from 'mathjs';
import BowEncoder from './bow-encoder';
import PhraseSegmenter from './phrase-segmenter';

export default class HarvestEncoder extends BowEncoder {
  constructor(script) {
    super(script, new PhraseSegmenter());
    this.slots = {}; // *文節の種類
    this._learn();
  }

  learn(script) {
    super.learn(script);
    this._learn();
  }

  _learn(){
    this.slots = {};

    for (let v in this.vocab) {
      let [key, word] = v.split('\t');
      if (key === '*' && word !== undefined) {
        this.slots[word] = this.vocab[v]
      }
    }
  }

  retrieve(code) {
    // intentが設定されており'*'以外なら探してoutとする
    let result = this._retrieveIntent(code);
    if (result !== false) { return result };

    // メイン辞書に記載された一部の文字列をタグに置き換える
    let text = code.text;
    text = this._tagging(text,'{BOT_NAME}');

    let nodes = this.segmenter.segment(text);

    // 類似度計算のときは「猫が」→「* 主語」のように文節の種類が与えられた
    // ノードは*に置き換える。foundsに*だったものを格納する。

    let founds = []; // 入力文字列の中に見つかった*文節
    let harvests = []; // *として採用された文節

    nodes = nodes.map(node => {
      let [surf, type] = node.split('\t');
      if (type !== undefined) {
        founds.push([surf, type]);
        return `*\t${type}`
      }
      return node;
    })

    result = super._retrieveIntent(code) || this._similarity(nodes);

    if (result.index === null || founds.length === 0) {
      return {
        ...result,
        harvests: []
      };
    }

    // phase 1: foundsとslotIndexの中で同じ種類のものをharvestsに
    for (let f of founds) {
      if(f[1] in this.slots){
        harvests.push(f)
      }
    }
    if (harvests.length !== 0) {
      console.log("harvest match",harvests)
      return {
        ...result,
        harvests: harvests
      }
    }

    // phase 2: 種類が違っていたらどれか一つをランダムに返す
    return {
      ...result,
      harvests: [founds[randomInt(founds.length)]]
    }
  }
}
