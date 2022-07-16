/*
bag-of-word encoderクラス
----------------------------

# 概要

Bag-og-word、つまり文字列を単語に分け、その順番を無視して単語ごとに数を
数えたものを文字列のベクトル化方法として、下記のようなフォーマットで
書かれたスクリプトの各入力文字列をベクトル化して記憶する。

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


# 使用法

let bowEncoder = new BowEndocer();

bowEncoder.learn(script); // スクリプトを記憶させる

const code = bowEncoder.retrieve(text); // textを内部コードとスコアに変換

codeは以下の情報で構成される
{
  score: 類似度の最大値,
  index: 類似度が最大だった行の番号（複数ある場合はランダムに選んだ一つ)
  status: "ok" or "error",
  message: エラーの場合エラーメッセージの文字列が渡される
}

# state
bowEncoderは以下の状態を取る

state
------------------------------------------
unload     スクリプトがロードされていない
loaded     スクリプトが読み込まれた
badscript  スクリプトの読み込みに失敗した
error      retrieveを実行し、失敗した
ok         retrieveを実行し、成功した
------------------------------------------

*/
import {
  zeros, divide, apply, sum, diag, dotMultiply,
  multiply, isPositive, map, norm, dot, randomInt
} from "mathjs";

import { TinySegmenter } from '../tinysegmenter';

let segmenter = new TinySegmenter();

export default class BowEncoder {

  constructor() {
    this.source = null;
    this.matrix = [];
    this.vocab = {};
    this.wv = null;
    this.idf = null;
    this.tfidf = null;
    this.index = [];
  }


  // -----------------------------------------------------
  //
  // スクリプトの記憶
  //
  // ----------------------------------------------------

  learn(script) {

    if (!("script" in script)) {
      return {
        status: "error",
        message: "スクリプトはscriptという要素に含まれている必要があります"
      }
    }
    if ((!Array.isArray(script.script)) || script.script.length === 0) {
      return {
        status: "error",
        message: "スクリプトが空です"
      }
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
        return {
          status: "error",
          message: `${i}行のinの形式が正しくありません`
        }
      }
    }

    // index(inScriptの行数とtfidfの凝集の対応表)と
    // vocab(全単語リスト)の生成

    let squeezed = [];
    for (let i = 0, l = inScript.length; i < l; i++) {
      for (let text of inScript[i]) {
        let words = segmenter.segment(text);
        squeezed.push(words);
        this.index.push(i);

        for (let word of words) {
          this.vocab[word] = true;
        }
      }
    }

    const vocabKeys = Object.keys(this.vocab);
    for (let i = 0, l = vocabKeys.length; i < l; i++) {
      this.vocab[vocabKeys[i]] = i;
    }

    // Term Frequency: 各行内での単語の出現頻度
    // tf(t,d) = (ある単語tの行d内での出現回数)/(行d内の全ての単語の出現回数の和)

    this.wv = zeros(squeezed.length, vocabKeys.length);
    let pos;
    for (let i = 0, l = squeezed.length; i < l; i++) {

      for (let word of squeezed[i]) {
        pos = this.vocab[word];
        if (pos !== undefined) {
          this.wv.set([i, pos], this.wv.get([i, pos]) + 1);
        }
      }
    }

    // tf = wv / wv.sum(axis=0)
    const inv_wv = apply(this.wv, 1, x => divide(1, sum(x)));
    this.tf = multiply(diag(inv_wv), this.wv);

    // Inverse Document Frequency: 各単語が現れる行の数の割合
    //
    //     df(t) = ある単語tが出現する行の数 / 全行数
    //     idf(t) = log(1 +1/ df(t) )   

    const num_of_columns = this.tf.size()[0];
    const df = apply(this.wv, 0, x => sum(isPositive(x)) / num_of_columns);
    // console.log("matrixize: tf=",tf,"df=",df)
    this.idf = map(df, x => Math.log(1 + 1 / x));
    this.tfidf = multiply(this.tf, diag(this.idf));

    // 正規化
    // すべてのtfidfベクトルの長さを1にする。これにより
    // retrieveでnormの計算をしないで済む

    const inv_n = apply(this.tfidf, 1, x => (divide(1, norm(x))));
    this.tfidf = multiply(diag(inv_n), this.tfidf);
    return { status: "ok" }
  }

  // ----------------------------------------------------
  //
  // 類似テキストの検索
  //
  // ----------------------------------------------------

  retrieve(text) {
    if (this.wv === null) {
      return {
        index: null, score: 0,
        status: "error",
        message: "スクリプトが読み込まれていません"
      };
    }

    // wv
    const vocabLength = Object.keys(this.vocab).length;
    if (vocabLength === 0) {
      return {
        index: null, score: 0,
        status: "error",
        message: "単語リストが空です"
      }
    }

    text = segmenter.segment(text);

    let wv = zeros(vocabLength);
    for (let word of text) {
      let pos = this.vocab[word];
      if (pos !== undefined) {
        wv.set([pos], wv.get([pos]) + 1);
      }
    }
    const sumWv = sum(wv);
    if (sumWv === 0) {
      return {
        index: null, score: 0,
        status: "ok",
      };
    }

    // tfidf計算
    const tf = divide(wv, sumWv);
    const tfidf = dotMultiply(tf, this.idf);
    // console.log("tfidf=",tfidf)
    // 正規化

    const n = norm(tfidf);
    const ntfidf = map(tfidf, x => (divide(x, n)));

    let scores;
    // script各行の類似度が最大値のindexをすべて抽出する
    try {
      scores = apply(this.tfidf, 1, x => dot(x, ntfidf));
    } catch (error) {
      console.log("invalid this.tfidf,tfidf=", this.tfidf, "error=", error);
      return {
        index: null, score: 0,
        status: "error",
        message: `tfidf行列が不正です。error=${error}`
      }
    }
    console.log("scores",scores)
    scores = scores.toArray();
    let maxScore = Math.max(...scores);
    let indexes = [];
    for (let i = 0, l = scores.length; i < l; i++) {
      if (scores[i] === maxScore) {
        indexes.push(this.index[i])
      }
    }


    return {
      index: indexes[randomInt(indexes.length)], score: maxScore,
      status: "ok",
    };
  }
}