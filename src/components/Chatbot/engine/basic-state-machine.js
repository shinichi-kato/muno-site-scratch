/*
Basic State Machine
===============================
基本の内的プロセス状態機械

起動準備ができたらチャットボットに{intent:'start'}を渡す。
それによりチャットボットは{intent:'start'}を出力するとともに稼働状態になる。
稼働状態では*、not_found、byeのいずれかに遷移する。

上述のパース内容は下記にBNF記法で記述した。これはhttps://www.bottlecaps.de/rr/ui
で可視化できる。
--------------------------------------------------------------------------------

main     ::= 'start' ( '*' | 'not_found' )* 'bye'

--------------------------------------------------------------------------------

*/

import { parseTables, dispatchTables } from './phrase-segmenter';

const STATE_TABLES = parseTables({
  main: [
    //           0  1  2  3  4  5
    '*         : 0  0  3  3  3  0',
    'start     : 2  0  0  0  0  0',
    'not_found : 0  0  4  4  4  0',
    'bye       : 0  0  5  5  5  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);


export default class BasicStateMachine {
  constructor() {
    this.states = [['main', 0]];
    this.precision = 0;

    this.lex = {
      '*': c => false,
      'start': c => c.intent === 'start',
      'not_found': c => c.score < this.precision,
      'bye': c => c.intent === 'bye',
    }
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
      intent: pos
    }

  }

}