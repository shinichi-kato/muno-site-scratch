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
  refractory,      // exit後に返答をしない回数(不応期)
  
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
利用して実装し、ロジックや内部状態の変化を実現する。内部状態によりアバターが
決まり、stateMachineの出力にはavatarの情報が含まれる。

入力: code = {score:float, index:int, intent:string}


### decoder
DecoderはStateMachineが出力した内部表現を、自然言語に変換する。変換には辞書を用いる。
内部表現はDecoderによりテキスト化してユーザに表示するだけでなく、システムの


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

なお、cellの各ファイルの中にbiomeを設定できるが、現状ではメインセルのbiomeだけが
利用され、biomeセルのbiomeは無視される。



## Cellの機能的分類

Cell                概要
----------------------------------------------------------------------
メイン              在室/不在、明舞、睡眠/覚醒、空腹、注意など  
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

# Biomebot

Biomebotにはインスタンス固有の情報があり、以下のようなものがある。
{BOT_NAME} : チャットボットの名前
{BOT_NAME_SPOKEN}: チャットボットをユーザや第三者が呼ぶときの呼び名
{BOT_LIKES_USER00}: ユーザに対するチャットボットの親密さ

親密さは本来ユーザごとに定義されるパラメータで、現状では簡易的にユーザ名で
識別する。ユーザ名をユーザIDに読み替えるテーブルを利用する。
親密さが低いとアバターとユーザは小さく表示され、距離が遠いことが表現される。
親密さが高いとアバターとユーザは大きく表示され、距離が近いことがわかる。
UIデザイン上はUserPanelとFairyPanelのwidthは30%が最小、50%が最大、とする。



*/
import React, {
  useEffect, useReducer, useCallback,
  createContext, useContext
} from 'react';
import { AuthContext } from "../Auth/AuthProvider";
import { Message } from '../message'

import { useBiome } from './useBiome';
import { db } from '../db';

export const BiomeBotContext = createContext();


const initialState = {
  status: 'init',
  url: '',
  avatarURL: '',
  avatarSize: 100,
  backgroundColor: '',
  botName: '',
}

function reducer(state, action) {
  switch (action.type) {
    case 'biomeReady': {
      return {
        status: 'biomeLoaded',
        url: action.url,
        avatarURL: '',
        closeness: action.closeness,
        backgroundColor: action.backgroundColor,
        botName: action.botName,
        userId: state.userId,
      }
    }

    case 'setCloseness': {
      return {
        ...state,
        closeness: action.closeness,
      }
    }

    case 'execute': {
      return {
        ...state,
        status: 'ready',
        avatarURL: action.avatarURL,
      }
    }

    default:
      throw new Error(`invalid action.type ${action.type}`);
  }
}

export default function BiomeBotProvider(props) {
  const [biomeState, biomeLoad, biomeUpdate] = useBiome(props.url);
  const [state, dispatch] = useReducer(reducer, initialState);
  const auth = useContext(AuthContext);

  const handleBotReady = props.handleBotReady;
  const url = props.url;

  useEffect(() => {
    if (auth.authState === 'ok' && biomeState.isReady) {
      (async() => {
        const uid = await db.getUserId(auth.displayName)
        const closeness = db.getMemoryValues(`{BOT_CLOSENESS_TO_USER${uid}`) || 0;

        dispatch({
          type: 'biomeReady',
          url: url,
          backgroundColor: biomeState.backgroundColor,
          botName: db.getBotName(),
          closeness: closeness
        });
  
        handleBotReady();
        console.log("botReady");
      })();
    }
  }, [
    auth.authState,
    biomeState.isReady,
    handleBotReady, url,
    biomeState.backgroundColor
  ]);

  useEffect(()=>{
    if(auth.authState==='ok' && biomeState.isReady){
      dispatch({
        type: 'setAvatarSize',
        avatarSize: 100, // ここでavatarサイズ計算db.getUserId(auth.displayName)
      })
    }
  },[auth.authState,biomeState.isReady]);

  function handleLoad(url) {
    biomeLoad(url);
  }

  const handleExecute = useCallback((userMessage, emitter) => {
    // db.memory辞書に記載された一部の文字列をタグに置き換える。
    // closure化するのを防ぐため内部で関数定義
    function _tagging(text, key) {
      let vals = db.getMemoryValues(key);
      for (let val of vals) {
        text = text.replace(val, key);
      }
      return text;
    }

    let text = userMessage.text;
    text = _tagging(text, '{BOT_NAME_SPOKEN}');
    text = _tagging(text, '{BOT_NAME}');
    text = _tagging(text, '{USER_NAME}');

    let code = {
      intent: userMessage.intent || '*',
      text: text,  
      owner: 'user',
    }

    let mode = biomeState.mode;
    let index = 0;
    let cell, cellName, retcode;

    while (true) {
      if (biomeState.order[mode].length <= index) {
        // order終端にいる
        // biome終端 -> mainへ。
        if (mode === 'biome') {
          mode = 'main';
          index = 0;
        } else {
          // main終端→エラー
          console.error("mainの状態機械が終了に到達しました。main状態機械は終了しない設計にしてください")
          index = 0;
        }
      }

      cellName = biomeState.order[mode][index];
      cell = biomeState.spool[cellName];
      retcode = cell.encoder.retrieve(code);
      retcode = cell.stateMachine.run(retcode);

      if (retcode.command === 'to_biome') {
        mode = 'biome';
        index = 0;
        continue;
      } else if (retcode.command === 'to_main') {
        mode = 'main';
        index = 0;
        continue;
      }

      if (retcode.intent === 'pass') {
        index++;
        continue;
      }
      break;
    }

    const avatarURL = `${biomeState.avatarDir}${retcode.avatar}`;
    biomeUpdate(mode, index);
    dispatch({ type: 'execute', avatarURL: avatarURL });

    // decode
    let rettext = cell.decoder.render(retcode);
    emitter(new Message('speech', {
      avatarURL: avatarURL,
      text: rettext,
      name: state.botName,
      backgroundColor: biomeState.backgroundColor,
      person: 'bot'
    }));

  }, [
    biomeUpdate,
    biomeState.order,
    biomeState.spool,
    biomeState.mode,
    biomeState.backgroundColor,
    biomeState.avatarDir,
    state.botName,
  ]);

  return (
    <BiomeBotContext.Provider
      value={{
        isReady: biomeState.isReady,
        load: handleLoad,
        execute: handleExecute,
        avatarURL: state.avatarURL,
        backgroundColor: state.backgroundColor,
      }}
    >
      {props.children}
    </BiomeBotContext.Provider>
  )
}