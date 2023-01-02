/*
Basic State Machine
===============================
基本の内的プロセス状態機械

セルが初めて実行されたとき、ユーザ入力に対して返答可能な場合 *enter 状態に
遷移して返答を行う。

返答可能な内容をユーザが話した場合は状態*に移動し、
それに対応した内容を返する。そうでなければ状態はenterに移り、自発的な発言を
行う。その後、scoreが低い場合はpassに移動し、次のcellに制御が映る
exitは明示的にdropする

セルは初期状態('main',0)から始まり、
起動準備ができたらチャットボットに{intent:'start'}を渡す。
それによりチャットボットは{intent:'start'}を出力するとともに稼働状態になる。
稼働状態では*、、byeのいずれかに遷移する。

上述のパース内容は下記にBNF記法で記述した。これはhttps://www.bottlecaps.de/rr/ui
で可視化できる。
--------------------------------------------------------------------------------

main ::= ('*'|'*enter') ('*'|'pass()')+

--------------------------------------------------------------------------------

*/

import { parseTables, dispatchTables } from './phrase-segmenter';

const STATE_TABLES = parseTables({
  main: [
    //         0  1  2  3  4  5
    '*       : 0  0  4  4  4  4',
    'enter   : 3  0  0  0  0  0',
    '*enter  : 2  0  0  0  0  0',
    'pass    : 0  0  5  5  5  5',
  ],
});

const AVATARS = {
  'enter': 'waving.svg',
  '*enter': 'waving.svg',
  'pass': 'peace.svg',
  'exit': 'peace.svg'
};

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);


export default class BasicStateMachine {
  constructor(script) {
    this.states = [['main', 0]];
    this.precision = 0;

    this.lex = {
      '*': c => false,
      'enter': c => c.intent === 'enter',
      '*enter': c => c.score < this.precision,
      'pass': c => c.score < this.precision,
      'exit': c => c.intent === 'exit',
    }

    this.learn(script)
  }

  learn(script) {
    this.precision = script.precision;
  }

  _assignPos(code, table, state) {
    for (let st in DISPATCH_TABLES[table][state]) {
      if (this.lex[st](code)) {
        return st;
      }
    }
    return '*';
  }

  run(code) {
    let table, state, pos, lastIndex;
    let loop = 0;

    while (true) {
      loop++;
      if (loop > 100) {
        throw new Error(`maybe infinite loop at ${code}`);
      }

      lastIndex = this.states.length - 1;
      [table, state] = this.states[lastIndex];
      pos = this._assignPos(code, table, state);
      this.states[lastIndex] = [table, STATE_TABLES[table][pos][state]];
      state = this.states[lastIndex][1];

      if (state === 0) {
        this.states = [['main', 0]];
        continue;
      }

      if (state === 1) {
        this.states.pop();
        continue;
      }

      break;
    }

    return {
      ...code,
      intent: pos,
      avatar: AVATARS[pos]
    }

  }

}