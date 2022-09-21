/*
naming state machine

名付けをおこなう内的プロセスの状態機械
==========================================
この状態機械は
・ユーザによるチャットボットへのニックネーム付与、
・ニックネームによりチャットボットが「呼ばれた」ことを認識する、
・チャットボットが不在の状態で呼ばれたら現れる、
という動作を行う。ロジックの詳細は以下にBNF記法で示す。
BNF記法は https://www.bottlecaps.de/rr/ui で可視化できる。
------------------------------------------------------------------------------------------
main     ::= ('start' | ('absent' 'stand-by'* 'summon'))
                      'accept()' ( ( '*' | 'not_found'| naming ) 'accept()' )* 'bye'
naming   ::= 'renaming'* ( 'memorized' | 'break' )
------------------------------------------------------------------------------------------

それぞれの状態では以下のような動作をする

| 状態の名前    | 動作内容                                                                 |
|---            |---                                                                       |
| start         | チャットボット在室の状態でスタート。挨拶を行う。                         |
| absent        | チャットボット不在の状態でスタート。不在を説明するシステムメッセージ出力 |
| summon        | ユーザの呼びかけに応えてチャットボットが現れる                           |
| stand-by      | summon以外の入力に対しては沈黙                                           |
| accept()      | ユーザの入力を受取り、scoreが低ければintentをnot_foundに                 |
| not_found     | 辞書中に対応する言葉が見つからない場合の対応                             |
| naming        | ユーザによるチャットボットの命名が行われた                               |
| bye           | ユーザが退室を希望した                                                   |
| renaming      | 仮に記憶したニックネームが正しいかどうかの確認を求める                   |
| memorized     | ニックネームを記憶した旨を知らせる                                       |
| break         | ニックネーム記憶をキャンセルした旨を知らせる                             |


この状態機械を利用するには「ニックネームらしき部分を入力文字列から抽出する」という機能がひ
まずpattern-encoderなどでユーザからの入力をコード化する。このとき辞書の形式を
in-outではなくin-intentとして、encoderからは行番号でなくcodeを受け取る。
{
  in: ["^ねえ(.+?)さん"],
  intent: "summon"
},




codeには以下の情報を格納する
{
  index: スクリプト中でヒットした行番号,
  harvests: その行の正規表現に()があれば抽出内容を格納,
}


*/

import { parseTables, dispatchTables } from './phrase-segmenter';
import { db } from './dbio';

const STATE_TABLES = parseTables({
  main: [
    //            0  1  2  3  4  5  6  7  8  9 10
    '*          : 0  0  6  4  4  6  7  6  6  6  0',
    'start      : 2  0  0  0  0  0  0  0  0  0  0',
    'absent     : 3  0  0  0  0  0  0  0  0  0  0',
    'summon     : 0  0  0  5  5  0  0  0  0  0  0',
    'not_found  : 0  0  0  0  0  0  8  0  0  0  0',
    'naming_sub : 0  0  0  0  0  0  9  0  0  0  0',
    'bye        : 0  0  0  0  0  0 10  0  0  0  0',
  ],
  naming_sub: [
    //           0  1  2  3  4  5  6
    '*         : 0  0  3  0  0  1  1',
    'naming    : 2  0  0  0  3  0  0',
    'renaming  : 0  0  0  5  0  0  0',
    'memorized : 0  0  0  4  0  0  0',
    'not_found : 0  0  0  6  0  0  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);
const LEX = {
  '*': c => false,
  'start': c => c.intent === 'start',
  'absent': c => c.intent === 'absent',
  'summon': c => c.intent === 'summon',
  'not_found': c => c.intent === 'not_found',
  'bye': c => c.intent === 'bye',
  'naming_sub': c => c.intent === 'naming_sub',
  'naming': c => c.intent === 'naming_sub',
  'renaming': c => c.intent === 'renaming',
  'memorized': c => c.intent === 'memorized',
};

function assignPos(code, currentState) {
  const [table, state] = currentState;

  for (let st in DISPATCH_TABLES[table][state]) {
    if (!(st in LEX)) {
      console.log("st not found", st)
    }
    if (LEX[st](code)) {
      return st
    }
  }
  return '*'
}



export default class NamingStateMachine {
  constructor(script) {
    this.states = [['main', 0]];
    this.learn(script);
  }

  learn(script) {
    this.precision = script.precision;
  }

  run(code) {
    /* 以下の内容を格納したcodeを受取り、次の状態を決める 
    code={
      intent: intent名,
      score: 1,
      harvests: 正規表現で獲得した後方参照文字列のリスト
      text: 入力文字列
      status: "ok"
    }
    */
    let table, state, pos;
    let loop = 0;

    while (true) {
      // 管理ループ
      loop++;
      if (loop > 100) {
        throw new Error(`Trapped in infinite loop at ${code.intent}`);
      }
      [table, state] = this.states[this.states.length - 1];
      pos = assignPos(code, this.states[this.states.length - 1]);
      this.states[this.states.length - 1] = [table, STATE_TABLES[table][pos][state]];
      state = this.states[this.states.length - 1][1];
      console.log("states", table, state)

      if (state === 0) {
        this.states = [['main', 0]];
        continue;
      }

      if (state === 1) {
        this.states.pop();
        continue;
      }



      if (pos in STATE_TABLES) {
        this.states.push([pos, 0]);
        continue;
      }

      if ((table === 'main' && state === 6 && pos === "*") ||
        (table === 'naming_sub' && state === 3 && pos === '*')) {
        // accept()
        if (code.score < this.precision) {
          code.intent = 'not_found'
        }
        console.log("accept", code, this.precision)
        continue;
      }

      break;
    }

    // 通常の処理
    // if (pos === '*') {
    //   return code
    // }

    if (pos === 'naming' || pos === 'renaming') {
      // code.harvestに取得したニックネームが格納されている。
      // これを辞書に追加する
      db.setItem('{LAST}', code.harvests[0]);
      console.log(pos, code.harvests)
    }

    if (pos === 'memorized') {
      let last = db.getValues('{LAST}');
      db.addItem('{BOT_NAME}', last[0]);
    }

    return {
      ...code,
      intent: pos,

    }
  }
}