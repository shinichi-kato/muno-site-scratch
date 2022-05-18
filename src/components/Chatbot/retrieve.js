/*
類似度計算
*/

import {
  zeros, apply, sum, dot, dotMultiply,
  map, norm, randomInt, divide, typeOf
} from "mathjs";

import { TinySegmenter } from './tinysegmenter';

let segmenter = new TinySegmenter();


export function retrieve(userText, cache) {

  let textScores = retrieve_function(userText, cache);
  // 最も類似度が高かった行のindexとその類似度を返す。
  // 同点一位が複数あった場合はランダムに一つを選ぶ

  textScores = textScores.toArray();
  const max = Math.max(...textScores);
  let cand = [];
  for (let i = 0, l = textScores.length; i < l; i++) {
    let score = textScores[i];
    if (score === max) {
      cand.push(cache.index[i]);
    }
  }

  return {
    score: max,
    index: cand[randomInt(cand.length)]
  };

}

export function textScore(userText, cache) {
  /*
  
  */
  let textScores = retrieve_function(userText, cache);
  if (textScores.score !== 0) {
    textScores = textScores.toArray();

  }

  let table = [];
  const inscript = cache.inScript;
  for (let i = 0, l = inscript.length; i < l; i++) {
    table.push({
      text: inscript[i],
      score: textScores.score === 0 ? 0 : textScores[i]
    });
  }

  return table;
}

function retrieve_function(userText, cache) {

  // message: 入力文字列
  // cache: キャッシュデータ

  if (typeOf(cache.tfidf) !== 'Matrix') {
    console.log("cache empty")
    return { index: null, score: 0 };
  }

  // wv
  if (cache.vocabLength === 0) {
    console.log("vocab empty")
    return { index: null, score: 0 }
  }

  let text = segmenter.segment(userText);


  let wv = zeros(cache.vocabLength);
  for (let word of text) {
    let pos = cache.vocab[word];
    if (pos !== undefined) {
      wv.set([pos], wv.get([pos]) + 1);
    }
  }
  const sumWv = sum(wv);
  if (sumWv === 0) {
    return { index: null, score: 0 };
  }

  // tfidf計算
  const tf = divide(wv, sumWv);
  const tfidf = dotMultiply(tf, cache.idf);
  // console.log("tfidf=",tfidf)
  // 正規化

  const n = norm(tfidf);
  const ntfidf = map(tfidf, x => (divide(x, n)));

  // message.textに対するinScript各行の類似度
  let textScores = [];
  try {
    textScores = apply(cache.tfidf, 1, x => dot(x, ntfidf));
  } catch (error) {
    textScores = [];
    console.log("invalid cache.tfidf,tfidf=", cache.tfidf, "error=", error)
  }

  return textScores;
}

