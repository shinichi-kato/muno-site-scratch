
import {
  zeros, divide, apply, sum, diag,
  multiply, isPositive, map, norm
} from "mathjs";

import { TinySegmenter } from './tinysegmenter';

let segmenter = new TinySegmenter();

export function matrixize(source, script) {
  let inScript = [];
  let outScript = [];

  // inスクリプトとoutスクリプトに分割
  for (let i = 0, l = script.length; i < l; i++) {
    let line = script[i];

    if ('in' in line && Array.isArray(line.in) && line.in.length !== 0 &&
      'out' in line && Array.isArray(line.out) && line.out.length !== 0) {
      inScript.push(line.in);
      outScript.push(line.out);
    }
    else {
      return {
        status: "error",
        message: `line ${i}でスクリプトの形式が正しくない`
      }
    }
  }

  // index(inとoutの対応表)と
  // vocab(全単語リスト)の生成

  let index = [];
  let squeezeDict = [];
  let vocab = {};
  let line;

  for (let i = 0, l = inScript.length; i < l; i++) {

    let inScript2 = inScript[i];
    for (let i2 = 0, l2 = inScript2.length; i2 < l2; i2++) {
      line = segmenter.segment(inScript2[i2]);
      squeezeDict.push(line);
      index.push(i);

      for (let word of line) {
        vocab[word] = true;
      }
    }
  }


  const vocabKeys = Object.keys(vocab);
  for (let i = 0, l = vocabKeys.length; i < l; i++) {
    vocab[vocabKeys[i]] = i;
  }

  // Term Frequency: 各行内での単語の出現頻度
  // tf(t,d) = (ある単語tの行d内での出現回数)/(行d内の全ての単語の出現回数の和)

  let wv = zeros(squeezeDict.length, vocabKeys.length);
  let pos;
  for (let i = 0, l = squeezeDict.length; i < l; i++) {

    for (let word of squeezeDict[i]) {
      pos = vocab[word];
      if (pos !== undefined) {
        wv.set([i, pos], wv.get([i, pos]) + 1);
      }
    }
  }
  // tf = wv / wv.sum(axis=0)
  const inv_wv = apply(wv, 1, x => divide(1, sum(x)));
  const tf = multiply(diag(inv_wv), wv);


  // Inverse Document Frequency: 各単語が現れる行の数の割合
  //
  //     df(t) = ある単語tが出現する行の数 / 全行数
  //     idf(t) = log(1 +1/ df(t) )   

  const num_of_columns = tf.size()[0];
  const df = apply(wv, 0, x => sum(isPositive(x)) / num_of_columns);
  // console.log("matrixize: tf=",tf,"df=",df)
  let idf = map(df, x => Math.log(1 + 1 / x));
  let tfidf = multiply(tf, diag(idf));

  // 正規化
  // すべてのtfidfベクトルの長さを1にする。これにより
  // retrieveでnormの計算をしないで済む

  const inv_n = apply(tfidf, 1, x => (divide(1, norm(x))));
  tfidf = multiply(diag(inv_n), tfidf);

  return {
    status: "loaded",
    source: source,
    index: index,
    outScript: outScript,
    vocab: vocab,
    vocabLength: Object.keys(vocab).length,
    wv: wv,
    idf: idf,
    tfidf: tfidf,
  };

}