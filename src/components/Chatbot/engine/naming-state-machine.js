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




codeには以下の情報を格納する
{
  index: スクリプト中でヒットした行番号,
  harvests: その行の正規表現に()があれば抽出内容を格納,
}

文字列の解析にはプッシュダウン・オートマトンを用い、状態遷移は以下にBNF記法でしめす。
BNF記法はこのサイトで可視化できる。https://www.bottlecaps.de/rr/ui

ver1           
------------------------------------------------------------------------------------------
main     ::= 'start' 'accept()' ( ( '*' | 'not_found'| naming ) 'accept()' )* 'bye'
naming   ::= ( 'apply_name()' 'confirm' 'test()' )+ ( 'memorize' | '*' )
------------------------------------------------------------------------------------------

ver2
main     ::= 'start' ('absent()' ('*' 'absent()')* 'summon') ?
                      'accept()' ( ( '*' | 'not_found'| naming ) 'accept()' )* 'bye'
naming   ::= ( 'apply_name()' 'confirm' 'accept()' )+ ( 'memorize' | '*' )

*/

import { CodeTwoTone } from '@mui/icons-material';
import { parseTables, dispatchTables, dispatch } from './phrase-segmenter';
const STATE_TABLES = parseTables({
  main: [
    //           0  1  2  3  4  5  6  7
    '*         : 0  0  3  4  3  3  3  0',
    'start     : 2  0  0  0  0  0  0  0',
    'not_found : 0  0  0  5  0  0  0  0',
    'naming    : 0  0  0  6  0  0  0  0',
    'bye       : 0  0  0  7  0  0  0  0',
  ],
  naming: [
    //          0  1  2  3  4  5  6
    '*        : 0  0  0  4  6  1  1',
    'get_name : 2  0  0  0  2  0  0',
    'confirm  : 0  0  3  0  0  0  0',
    'memorize : 0  0  0  0  5  0  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);
const LEX = {
  '*': c => false,
  'start': c => c.intent === 'start',
  'not_found': c => c.intent === 'not_found',
  'bye': c => c.intent === 'bye',
  'naming': c => c.intent === 'naming',
  'confirm': c => c.intent === 'confirm',
  'memorize': c => c.intent === 'memorize'
};

function assignPos(code, currentState) {
  const [table, state] = currentState;

  for (let st in DISPATCH_TABLES[table][state]) {
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
    this.names = [script.name || "noname"];
    this.harvest = "";
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
    let table, state;
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

      if (state === 0) {
        this.states = [['main', 0]];
        continue;
      }

      if (state === 1) {
        this.states.pop();
        continue;
      }

      if (pos in STATE_TABLES) {
        states.push([pos, 0]);
        continue;
      }

      if ((table === 'main' && state === 3) ||
        (table === 'naming' && state === 4)) {
        // accept()
        if (code.score < this.precision) {
          code.intent = 'not_found'
        }
        continue;
      }

      if (table === 'naming' && state === 2) {
        // get_name()
        this.harvest = code.harvests[0];
        continue;
      }

      break;
    }

    // 通常の処理
    if(pos === '*'){
      return code
    }
    if(pos === 'memorize'){
      this.names.push(this.harvest);
    }
    return {
      ...code,
      intent: pos,
      
    }
  }
}