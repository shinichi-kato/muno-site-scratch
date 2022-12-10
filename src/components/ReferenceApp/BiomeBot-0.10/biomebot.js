/*
BiomeBot-0.10.0
=============================

複数の「心のパート」が相互作用しながら会話を形成するチャットボット

強く記憶に残るような体験をしている瞬間、感情的な心と冷静な心が自分の中に
共存し、入れ替わりに表面に現れるという経験をしたことはないだろうか。
人の心には好奇心、喜怒哀楽、承認欲求、不満や不安、眠りたいなど数多くの
「心」が存在し、それは「心のパート」と呼ばれている。複数の心のパートは
共存して同時並行的に作用し、ある瞬間に優勢になったパートが返答を生成して
いると考えることができる。

BiomeBotはこれらの心のパートをそれぞれ単純な機能を持ったチャットボット
(以降Cellと呼ぶ)として実装し、複数のCellを競争的に動作させて一つの
キャラクタを形成するようにさせることで一見複雑な雑談の実現を目指す。
BiomebotではチャットボットをCellという生物の集まった生態系的に見立てて
いる。生態系には生物が生息する環境としての側面があり、チャットボットの
場合それはチャットボットの在室/不在や睡眠/覚醒のリズム、食事のリズム、
体調の変動などと見ることができる。


# Cell
## Cellの構造

cellは以下のプロパティで構成される。
{
  fileName,        // メインCellのファイル名(idとして利用)
  description,     // 説明
  updatedAt,       // 最終更新日
  creator,         // 作成者
  
  avatarDir,       // 画面に表示するアバターを格納したディレクトリ
  defaultAvatar,   // 初期のアバター
  backgroundColor, // アバターと吹き出しの背景色

  encoder,         // エンコーダのモジュール名
  stateMachine,    // 状態機械のモジュール名
  decoder,         // デコーダのモジュール名
  precision,       // 返答を生成する閾値
  retention,       // 
  
  biome: [],       // 「deploy_biome」コマンドで実行されるcellのリスト
  script: []       // スクリプト
}


### encoder
Encoderは入力されたテキストに対して自然言語処理のための前処理を行う。また
辞書を利用してユーザの入力を内部表現に変換する。内部表現は辞書の
インデックスや特定のコードである。

### stateMachine
StateMachineはEncoderが出力した内部表現を入力として受取り、出力のための
内部表現を生成する。入力と出力の関係はプッシュダウン・オートマトンなどを
利用して実装し、ロジックや内部状態の変化を実現する。

### decoder
DecoderはStateMachineが出力した内部表現を、自然言語やアバターなどから
なる出力に変換する。変換には辞書を用いる。
内部表現はDecoderによりテキスト化してユーザに表示するだけでなく、システムの
状態を変えるコマンドを記述することができる
  * {activate *} 同じbiomeに属するcellに強制的に遷移する
  * {run_biome} biomeを利用した会話を行う


### biome
同じディレクトリに格納されたcellの定義ファイル(*.json)のリスト。
{deploy_biome}コマンドが実行されると、biomeの0番目のcellのencodeが実行される。
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
5. {run_biome}

メインセルのstateMachineはこの1-5のがカスケード型に組み合わされた構造をとる。


# アバター
チャットボットの状態を表現する有力な手段がアバターで、BiomeBotでは下記の
ようなAvatarを利用する。Avatarは状態機械が返すcodeのintentに応じて変更される。

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

*/

import Cell from './cell';
import CellOrder from './cell-order';

class Biomebot {
  /*
    ブラウザ上で同時に実行できるbiomebotは一つだが、複数のbiomebotを
    切り替えることができる。各biomebotを
  */
  constructor() {
    this.biome = new CellOrder();
    this.work = {

    };


  }

  run(userText) {
    let code = {
      intent: '*',
      text: userText,
      owner: 'user',
    }
    let cell;
    for (cell of this.biome.cells()) {
      code = cell.run(code)
      if (code.command === 'to_biome'){
        this.biome.changeMode('biome');
      }
      else if (code.score > 0) {
        break;
      }
    }

    // hoist,drop処理
    if (code.command === 'hoist') {
      this.biome.hoist(cell);
    } else if (code.command === 'drop') {
      this.biome.drop(cell);
    }



  }

  async fetchBot(url) {
    /* 
      httpサーバーからjson形式のデータをフェッチし、indexDBに書き込む。
      読み込んだデータのbaseName(.jsonを除いたファイル名)がindexDB中の
      cellのbaseNameと同じだった場合、読み込んだデータで上書きする。
      得られたファイルにbiome[]が記述されていたら
      そこに書かれた.jsonもフェッチする。mainCellおよびbiomeのすべての
      cellは異なるbaseNameでなければならない。
    */

    const { dir, fileName } = splitPath(url);

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    });

    let mainCell = new Cell(fileName, await response.json());
    this.biome.setMainCell(mainCell);

    if (!isUnique(fileName, mainCell.biome)) {
      throw new Error("指定したbiomeまたはcellに重複があります")
    }

    for (let name of mainCell.biome) {
      let response = await fetch(`${dir}${name}`);
      let cell = new Cell(name, await response.json());
      this.biome.addBiomeCell(cell);
    }
  }

  async save() {
    let cellOrder = () => {

    }
  }
}

function splitPath(url) {
  const match = url.match("(.+/)(.+?)([\?#;].*)?$")
  return {
    dir: match[1],
    filename: match[2]
  }
}

function isUnique(filename, biome) {
  let cellSet = {}
  cellSet[filename] = true;

  for (let cell of biome) {
    cellSet[cell] = true;
  }

  const cells = Object.keys(cellSet);
  return cells.length === biome.length + 1
}
