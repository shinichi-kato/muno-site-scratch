/*
BiomeBot-0.10.0
=============================

複数の「心のパート」が相互作用しながら会話を形成するチャットボット

強く記憶に残るような体験をしている瞬間、感情的な心と冷静な心が自分の中に
共存し、入れ替わりに表面に現れるという経験をしたことはないだろうか。
人の心には好奇心、喜怒哀楽、承認欲求、不満や不安など数多くの「心」が
存在し、それは「心のパート」と呼ばれている。複数の心のパートは共存して
同時並行的に作用し、ある瞬間に優勢になったパートが返答を生成していると
考えることができる。これに加え空腹、睡眠/覚醒など環境や生理的変化もまた
人の行動や発言をトリガーする。

これらの個別の働きをそれぞれシンプルなチャットボットとし、セルと呼ぶ。
BiomeBotは環境などに応対し会話よりも優先して動作するする一つの
「mainセル」と会話を司る会話を司る複数の「Biomeセル」で構成される。

チャットボットは内部的にmainモードとbiomeモードがあり、mainモードでは
mainセルが実行され、環境に応じて反応を行うとともにmainセル中のコマンド
でbiomeモードに移行できる。biomeモードでは複数のbiomeセルがカスケード
的に動作し、一つのBiomeセルが応答できなかったら次のBiomeセルが応答を
試みる、という動作を繰り返し、いずれのbiomeセルも応答できなかった場合は
mainセルに制御が戻る。


# Cell
## Cellの構造

cellは以下のプロパティで構成される。
{
  fileName,        // メインCellのファイル名(idとして利用)
  description,     // 説明
  updatedAt,       // 最終更新日
  creator,         // 作成者
  
  avatarDir,       // 画面に表示するアバターを格納したディレクトリ
  backgroundColor, // アバターと吹き出しの背景色

  encoder,         // エンコーダのモジュール名
  stateMachine,    // 状態機械のモジュール名
  decoder,         // デコーダのモジュール名
  precision,       // 返答を生成する閾値
  retention,       // 
  
  biome: [],       // 「to_biome」コマンドで実行されるcellのリスト
  script: []       // スクリプト
}


### encoder
Encoderは入力されたテキストに対して自然言語処理のための前処理を行う。また
辞書を利用してユーザの入力を内部表現に変換する。内部表現は辞書の
インデックスや特定のコードである。
入力：text
出力：code = {score:float, index:int, intent:string}

### stateMachine
StateMachineはEncoderが出力した内部表現を入力として受取り、出力のための
内部表現を生成する。入力と出力の関係はプッシュダウン・オートマトンなどを
利用して実装し、ロジックや内部状態の変化を実現する。
入力: code = {score:float, index:int, intent:string}

### decoder
DecoderはStateMachineが出力した内部表現を、自然言語やアバターなどから
なる出力に変換する。変換には辞書を用いる。
内部表現はDecoderによりテキスト化してユーザに表示するだけでなく、システムの
状態を変えるコマンドを記述することができる
  * {activate *} 同じbiomeに属するcellに強制的に遷移する
  * {run_biome} biomeを利用した会話を行う


### biome
同じディレクトリに格納されたcellの定義ファイル(*.json)のリスト。
{to_biome}コマンドが実行されると、biomeの0番目のcellのencodeが実行される。
encodeのスコアがprecisionより小さい場合、biomeの順にencodeとprecisionチェックを
繰り返す。

encodeのスコアが大きcellに行き当たった場合このcellのstateMachineが実行され、
結果に基づいてdecodeが行われる。decodeが実行されたらretentionによるチェックを
行い、成功したらこのcellはbiomeの先頭に順序が移動する。
失敗したらこのcellはbiomeの末尾に順序が移動し、制御がこのcellのStateMachineに
戻る。



## Cellの機能的分類

Cell                概要
----------------------------------------------------------------------
メイン              在室/不在、睡眠/覚醒、空腹、注意など  
挨拶                会話開始時に挨拶する
好奇心              知らない言葉を聞いて覚える
エピソード          ログに倣って返答する
リフレーミング      ユーザのネガティブ発言をポジティブに言い換え
傾聴                    
-----------------------------------------------------------------------

メインセルは下記に示すような会話以前の「存在感」に属するような振る舞いを司る。

1. 不在/在室
2. 睡眠/覚醒、
3. 空腹、
4. 名前を認識して注意状態になる



# アバター
チャットボットの状態を表現する有力な手段がアバターで、BiomeBotでは下記の
ようなAvatarを利用する。Avatarは状態機械の中で決められ、状態機械の出力する
codeに含められる。

アバター名   概要
--------------------------------------------------------------
absent       不在
sleepy       眠い・・・覚醒/睡眠のパートが使用
sleep        睡眠中・・・覚醒/睡眠のパートが使用
wake         起床した・・・覚醒/睡眠のパートが使用
peace        平常
cheer        盛り上がっている
down         落ち込んでいる
waving       手を振っている
--------------------------------------------------------------

# script

[
  intent: ,
  in: [],
  out: [],
]

# biomebotのID

*/
import React, {
  useEffect, useReducer, useCallback,
  createContext
} from 'react';
import Message from './message'

import { BIOME_READY, useBiome } from './useBiome';
// import {db} from './db';

export const BiomeBotContext = createContext();


const initialState = {
  status: 'init',
  url: '',
  avatarUrl: '',
  backgroundColor: '',
}

function reducer(state, action) {
  switch (action.type) {
    case 'biomeReady': {
      return {
        status: 'biomeLoaded',
        url: action.url,
        avatarUrl: '',
        backgroundColor: action.backgroundColor
      }
    }

    case 'execute': {
      return {
        ...state,
        status: 'ready',
        avatarUrl: action.avatarUrl,
      }
    }

    default:
      throw new Error(`invalid action.type ${action.type}`);
  }
}

export default function BiomeBotProvider(props) {
  const [biomeState, biomeLoad, cells, exitCells, changeMode, hoist, drop] = useBiome(props.url);
  const [state, dispatch] = useReducer(reducer, initialState);
  const handleBotReady = props.handleBotReady;
  const url = props.url;

  useEffect(() => {
    if (biomeState.isReady) {
      dispatch({
        type: 'biomeReady',
        url: url,
        backgroundColor: biomeState.backgroundColor
      });
      handleBotReady();
      console.log("botReady");

    }
  }, [biomeState.isReady, handleBotReady, url, biomeState.backgroundColor]);

  function handleLoad(url) {
    biomeLoad(url);
  }

  const handleExecute = useCallback((userMessage, emitter) => {
    let code = {
      intent: userMessage.intent || '*',
      text: userMessage.text,  // {BOT_NAME} {USER_NAME}をタグ化（未実装)
      owner: 'user',
    }

    let cell, retcode;
    for (cell of cells()) {
      console.log("cell",cell)
      retcode = cell.encoder.retrieve(code);
      retcode = cell.stateMachine.run(retcode);
      if (retcode.intent === 'to_biome' && biomeState.status >= BIOME_READY) {
        changeMode('biome');
      }
      else if (retcode.intent !== 'pass') {
        break;
      }
    }
    exitCells();
    // hoist,drop処理
    console.log("cell",cell)
    if (cell.retention < Math.random()){
      drop(cell.name);
    } else {
      hoist(cell.name);
    }
    // そのほか明示的hoist.dropは後で考える

    const avatarUrl = `${biomeState.avatarDir}${retcode.avatar}`;

    // decode
    dispatch({ type: 'execute', avatarUrl: avatarUrl})
    let rettext = cell.decoder.render(retcode);

    emitter(new Message({
      avatar: avatarUrl,
      text: rettext,
      person: 'bot'
    }));
  }, [
    cells, exitCells,
    changeMode,
    drop, hoist,
    biomeState.status,
    biomeState.avatarDir,
  ]);

  return (
    <BiomeBotContext.Provider
      value={{
        isReady: biomeState.isReady,
        load: handleLoad,
        execute: handleExecute,
        avatarUrl: state.avatarUrl,
        backgroundColor: state.backgroundColor,
      }}
    >
      {props.children}
    </BiomeBotContext.Provider>
  )
}