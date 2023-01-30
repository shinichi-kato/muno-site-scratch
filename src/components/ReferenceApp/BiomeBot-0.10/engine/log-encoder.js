/*
log encoderクラス
----------------------------

# 概要

テキストの内部表現をBag-of-words(BOW)とし、tftdf行列で類似度の評価を行う
encoderで、BOWとtfidfの詳細はbow-encoderに準じる。入力するスクリプトとして
ログファイルから生成したデータを用いる。

ログファイルは時系列順に会話が記録されており、n行目と似た入力文字列に対して
n+1行目を出力文字列とする。

## 文脈性の改善


*/

import {
  zeros, divide, apply, sum, diag, dotMultiply,
  multiply, isPositive, map, norm, dot, randomInt
} from "mathjs";

import { TinySegmenter } from './tinysegmenter';
import { InvalidScriptException } from './exceptions.js';
import { db } from '../../db';

const RE_MAIN_TAG = /{[A-Z_][A-Z0-9_]*}/g;

export default class LogEncoder {

  constructor(script) {
    this.matrix = [];
    this.vocab = {};
    this.vocabLength = 0;
    this.wv = null;
    this.idf = null;
    this.tfidf = null;
    this.index = [];
    this.intents = {};
    this.segmenter = new TinySegmenter();
    this.learn(script);

  }



  // -----------------------------------------------------
  //
  // スクリプトの学習
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
    this.convlution = script.convolution;
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

    // index(inScriptの行数とtfidfの凝集の対応表)と
    // vocab(全単語リスト)の生成

    let squeezed = [];
    for (let i = 0, l = inScript.length; i < l; i++) {
      for (let text of inScript[i]) {
        let words = this.segmenter.segment(text);
        squeezed.push(words);
        this.index.push(i);

        for (let word of words) {
          this.vocab[word] = true;
        }
      }
    }

    const vocabKeys = Object.keys(this.vocab);
    this.vocabLength = vocabKeys.length;
    for (let i = 0, l = this.vocabLength; i < l; i++) {
      this.vocab[vocabKeys[i]] = i;
    }
    // Term Frequency: 各行内での単語の出現頻度
    // tf(t,d) = (ある単語tの行d内での出現回数)/(行d内の全ての単語の出現回数の和)

    this.wv = zeros(squeezed.length, this.vocabLength);
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
  }



  // ----------------------------------------------------
  //
  // 類似テキストの検索
  //
  // ----------------------------------------------------  

  retrieve(code) {
    /* code={intent: string, text: string, owner: string}　*/

    // intentが設定されており'*'以外なら探してoutとする
    let result = this._retrieveIntent(code);
    if (result !== false) { return result };

     // segment
    let nodes = this.segmenter.segment(code.text);
    console.log(nodes)
    // similarity計算
    result = this._similarity(nodes);
    
    // i行のintentを探す
    for(let x in this.intents){
      if(this.intents[x] === result.index){
        result.intent = x;
      }
      break;
    }

    return result;
  }

  _tagging(text, key){
    let vals = db.getMemoryValues(key);
    for(let val of vals){
      text = text.replace(val,key);
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

  _similarity(nodes) {
    let wv = zeros(this.vocabLength);
    for (let word of nodes) {
      let pos = this.vocab[word];
      if (pos !== undefined) {
        wv.set([pos], wv.get([pos]) + 1);
      }
    }
    const sumWv = sum(wv);
    if (sumWv === 0) {
      return {
        index: null, score: 0, intent: "*",
        status: "ok",
      };
    }
    // tfidf計算
    const tf = divide(wv, sumWv);
    const tfidf = dotMultiply(tf, this.idf);
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
        index: null, score: 0, intent: "*",
        status: `tfidf行列が不正です。error=${error}`
      }
    }
    scores = scores.toArray();
    let maxScore = Math.max(...scores);
    let indexes = [];
    for (let i = 0, l = scores.length; i < l; i++) {
      if (scores[i] === maxScore) {
        indexes.push(this.index[i])
      }
    }

    return {
      intent: "*",
      index: indexes[randomInt(indexes.length)],
      score: maxScore,
      status: "ok"
    }
  }

  expand(tag) {
    /* 
    タグ文字列を再帰的に展開する。
    {CAPITAL}はmemory辞書のタグを置き換える。
    {non_capital}は同じ辞書の中から候補を探して展開する
    */
    let vals = db.getMemoryValues(tag);
    let val = vals[randomInt(vals.length)];

    return val.replace(RE_MAIN_TAG, (itemTag) => this.expand(itemTag))

  }
}