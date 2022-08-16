/*
naming state machine

名付けをおこなう内的プロセスの状態機械
==========================================
現在の状態を保持し、ユーザ入力から次のチャットボットの行動を決定して返す。

まずpattern-encoderなどでユーザからの入力をコード化する。このとき辞書の形式を
in-outではなくin-intentとして、encoderからは行番号でなくcodeを受け取る。
{
  in: ["^ねえ(.+?)さん"],
  intent: "summon"
},
{
  in: ["*"],
  intent: "u_*"
}

usage:
let m = new NamingStateMachine();

let state = m.run(code)

codeには以下の情報を格納する
{
  index: スクリプト中でヒットした行番号,
  harvests: その行の正規表現に()があれば抽出内容を格納,
}

文字列の解析にはプッシュダウン・オートマトンを用い、状態遷移は以下にBNF記法でしめす。
BNF記法はこのサイトで可視化できる。https://www.bottlecaps.de/rr/ui

------------------------------------------------------------------------------------------
main ::= ('u_*' ('b_*' 'u_*')*)? naming
naming ::= 'u_try' 'b_confirm' (('u_revise'|'u_try')
           'b_confirm')* ('u_accept' 'b_agree'|'u_*' 'b_break')
------------------------------------------------------------------------------------------

*/

import { parseTables,dispatchTables, dispatch } from 'mathjs';
const STATE_TABLES = parseTables({
  main: [
    //         0  1  2  3  4
    'u_*     : 2  0  0  2  0',
    'b_*     : 0  0  3  0  0',
    'naming  : 4  0  4  0  0',
  ],
  naming: [
    //           0  1  2  3  4  5  6  7  8  9
    'u_*       : 0  0  0  8  0  0  0  1  9  1',
    'u_try     : 2  0  0  5  0  0  0  0  0  0',
    'b_confirm : 0  0  3  0  3  3  0  0  0  0',
    'u_revise  : 0  0  0  4  0  0  0  0  0  0',
    'u_accept  : 0  0  0  6  0  0  0  0  0  0',
    'b_agree   : 0  0  0  0  0  0  7  0  0  0',
    'b_break   : 0  0  0  0  0  0  0  0  0  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);

function assignPos(code, currentState) {
  const [table, state] = currentState;

  for (let st in DISPATCH_TABLES[table][state]) {
    if (code===st) {
      return st
    }
  }
  return '*'
}

export default class NamingStateMachine {
  constructor(names){
    this.states=[['main',0]];
    this.names=[...names];
  }

  run(code){
    
  }
}