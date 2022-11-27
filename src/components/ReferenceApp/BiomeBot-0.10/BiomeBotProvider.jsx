/* 
BiomeBot-0.10.0
=============================

複数の「心のパート」が相互作用しながら会話を形成するチャットボット

強く記憶に残るような体験をしたとき、感情的な心と冷静な心が自分の中に
共存し、入れ替わりに表面に現れるという経験をしたことはないだろうか。
人の心には好奇心、喜怒哀楽、承認欲求、不満や不安、眠りたいなど数多くの
「心」が存在し、それは「心のパート」と呼ばれている。複数の心のパートは
競争的・共存的に動作し、ある瞬間に優勢になったパートが返答を生成して
いると考えることができる。

BiomeBotはこれらの心のパートをそれぞれ単純な機能を持ったチャットボット
(以降Cellと呼ぶ)として実装し、複数のCellBotを集めて一つのキャラクタを
形成するように動作させることで一見複雑な雑談の実現を目指す。

# Cell
## 各Cellの構造

CellはEncoder, State Machine, Decoderで構成される。

* Encoderは入力されたテキストに対して自然言語処理のための前処理を行う。また
辞書を利用してユーザの入力を内部表現に変換する。内部表現は辞書の
インデックスや特定のコードである。

* StateMachineはEncoderが出力した内部表現を入力として受取り、出力のための
内部表現を生成する。入力と出力の関係はプッシュダウン・オートマトンなどを
利用して実装し、ロジックや内部状態の変化を実現する。

* DecoderはStateMachineが出力した内部表現を、自然言語やアバターなどから
なる出力に変換する。変換には辞書を用いる。
内部表現はDecoderによりテキスト化してユーザに表示するだけでなく、システムの
状態を変えるコマンドを記述することができる
  * {push *.json}  *.jsonで示されたセルに移動する。
  * {pop} pushしたセルに戻る



## Cellの機能的構成
Biomebotは一つのメインセルと複数のサブセルを組み合わせて動作する。
メインセルは下記に示すような会話以前の基本的な振る舞いを司る。

1. 不在/在室
2. 睡眠/覚醒、
3. 空腹、
4. 名前を認識して注意状態になる
5. 会話セルの実行

メインセルのstate machineは1-5をカスケード接続した構造になっている。
メインセルの5は複数の会話セルが競争的に動作する構成になっており、
サブセルには例えば以下のような種類がある

サブCell                概要
----------------------------------------------------------------------
挨拶                    会話開始時に挨拶する
好奇心                  知らない言葉を聞いて覚える
エピソード              ログに倣って返答する
リフレーミング          ユーザのネガティブ発言をポジティブに言い換え
傾聴                    
-----------------------------------------------------------------------

すべてのサブセルはリストに格納される。セルにはPrecisionとRetentionという
固定のパラメータがある。

1. セントラルセルが入力を受取り、EncodeとStatemachineの動作を行う。
   その結果セントラルセルの状態が `5.会話セルの実行` になった場合2以降を
   実行する。そうでない場合は1に戻る
2. すべての会話セルはユーザからの入力を受け取ってEncodeとStateMachineの動作を
   行う。


1. 全CellBotはユーザからの入力を受取ってEncodeとStateMachineの動作を行う。
2. CellBotリストの順にEncodeのscoreがPrecision値よりも高いかどうか検査し、
高かったらdecodeを実行するとともにretentionチェックを行い、成功したら
該当CellBotはリストの先頭に移動する。失敗したら該当CellBotはリストの末尾に
移動する。
3. 1に戻る


# アバター
チャットボットの状態を表現する有力な手段がアバターで、BiomeBotでは下記の
ようなAvatarを利用する。Avatarはセントラルセルの状態で変わるほか、
会話セルにつき一つ

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

*/

import React, {
  useContext,
  createContext
} from 'react';
import { AuthContext } from "../Auth/AuthProvider";

export const AuthContext = createContext();

export const defaultSettings = {
  botId: null,
  config: {
    backgroundColor: "",
    avatarPath: "",
    keepAliveMinutes: 10,
  },
  main: {
    "NAME": "undefined",
  },
  work: {
    updatedAt: "",
    status: "",
    talkCellOrder: [],
    celtralCell: null,
    talkCells: null
  }
}

function reducer(state, action){
  
}

export default function BiomeBotProvider(props){
  const [state,dispatch] = useReducer(reducer, initialState);

  return (
    <BiomeBotContext.Provider
      value={{
        execute: handleExecute,
      }}
    >
      {props.children}
    </BiomeBotContext.Provider>
  )
}