/*
harvest encoderクラス
----------------------------

# 概要

Harvestエンコーダーは入力文字列を文節に分け、その順番を無視して単語ごとに数を
数える方法で文字列のベクトル化する。形態素ではなく文節を単位とすることで、


スクリプトを記憶したインスタンスに文字列を入力すると、スクリプトの中で
その文字列に最もよく似た行の番号リストと、類似度を表すscoreを返す。

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

# 文節区切りの方法

Tiny


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

class HarvestEncoder extends BowEncoder {
  constructor() {
    super(new PhraseSegmenter());
    this.slotIndex = {}; // *文節のインデックス
  }

  learn(script) {
    super.learn(script);
    this.phraseIndex = {};

    for (let v in this.vocab) {
      let [key, word] = v.split('\t');
      if (key === '*' && word !== undefined) {
        this.slotIndex[word] = this.vocab[v]
      }
    }
  }

  retrieve(text) {
    const check = this._precheck();
    if (check.status !== 'ok') return check;

    nodes = this.segmenter.segment(text);

    // 類似度計算のときは「猫が」→「* 主語」のように文節の種類が与えられた
    // ノードは*に置き換える。foundsに*だったものを格納する。

    let founds = []; // 入力文字列の中に見つかった*文節
    let slots = []; // 辞書のなかで入力と類似度が高かった行の*文節
    let harvests = []; // *として採用された文節

    nodes = nodes.map(node => {
      let [surf, type] = node.split('\t');
      if (type !== undefined) {
        founds.push([surf, type]);
        return `*\t${type}`
      }
      return node;
    })
    let result = this._similarity(nodes);

    if (result.index === null || founds.length === 0) {
      return {
        ...result,
        harvests: []
      };
    }

    // phase 0: 辞書のヒットした行に含まれる有効な文節をslotsに収集

    let wv = this.wv[result.index];
    for (let ph in this.phraseIndex) {
      if (wv[this.phaseIndex[ph]] !== 0) {
        let [surf, type] = ph.split('\t');
        slots.push([surf, type]);
      }
    }

    if (slots.length === 0 ) {
      return {
        ...result,
        harvests: []
      };
    }

    // phase 1: acceptingsとslotで同じ種類のものをharvestsに
    for (let a of acceptings) {
      for (let s of slots) {
        if (a[1] === s[1]) {
          harvests.push(a)
        }
      }
    }
    if (harvests.length !== 0) {
      return {
        ...result,
        harvests: harvests
      }
    }

    // phase 2: 種類が違っていたらどれか一つをランダムに返す
    return {
      ...result,
      harvests: [acceptings[randomInt(acceptings.length)]]
    }
  }
}
