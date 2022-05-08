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
  // message: 入力文字列
  // cache: キャッシュデータ

  if (typeOf(cache.tfidf) !== 'Matrix' || cache.fv.length === 0) {
    console.log("cache empty")
    return { index: null, score: 0 };
  }

  // wv
  if(cache.vocabLength === 0){
    console.log("vocab empty")
    return {index: null, score: 0}
  }

  let text = segmenter.segment(userText); 


  let wv = zeros(cache.vocabLength);
  for (let word of text) {
    let pos = cache.vocab[word];
    if(pos !== undefined){
      wv.set([pos], wv.get([pos])+1);
    }
  }
  const sumWv = sum(wv);
  if(sumWv === 0){
    return {index: null, score: 0};
  }

  // tfidf計算
  const tf = divide(wv, sumWv);
  const tfidf = dotMultiply(tf, cache.idf);
  // console.log("tfidf=",tfidf)
  // 正規化

  const n = norm(tfidf);
  const ntfidf = map(tfidf, x => (divide(x, n)));

  // message.textに対するinScript各行の類似度
  let textScore = [];
  try {
    textScore = apply(cache.tfidf, 1, x => dot(x, ntfidf));
  } catch (error) {
    textScore = [];
    console.log("invalid cache.tfidf,tfidf=", cache.tfidf, "error=", error)
  }

  // bugfixで入れたが本当に必要か？↓
  if(textScore.size()[0] === 1){
    let cand = cache.index[0];
    return {
      score: 1,
      index: cand[randomInt(cand.length)]
    };
  }

  // 最も類似度が高かった行のindexとその類似度を返す。
  // 同点一位が複数あった場合はランダムに一つを選ぶ

  const max = Math.max(...textScore);
  let cand = [];
  for (let i=0,l=textScore.length; i<l; i++){
    let score = textScore[i];
    if (score === max) {
      cand.push(cache.index[i]);
    }
  } 

  return {
    score: max,
    index: cand[randomInt(cand.length)]
  };
}