/*
Basic State Machine
===============================
基本のBiome内的プロセス状態機械

Biomeは複数のBiomeセルがカスケード接続されていることを想定している。
初期状態で、ユーザの入力に応答可能な場合はenterに遷移し、返答を返す。
応答できない場合はpass(1)に遷移し、これをトリガーとして次のセルに制御が移る。

一度enterに移動したあとは、辞書を検索して応答可能なら*、応答できない場合は
pass(2)に移動する。

上述のパース内容は下記にBNF記法で記述した。これはhttps://www.bottlecaps.de/rr/ui
で可視化できる。
--------------------------------------------------------------------------------

basic    ::= 'pass(1)'* ( 'enter' | '*' ) ( '*' | 'pass(2)' )+

--------------------------------------------------------------------------------

*/

import { parseTables, dispatchTables } from './phrase-segmenter';

const STATE_TABLES = parseTables({
  main: [
    //         0  1  2  3  4  5  6
    '*       : 4  0  4  5  5  5  5',
    'enter   : 3  0  3  0  0  0  0',
    'pass    : 2  0  2  6  6  6  6',
  ],
});

const AVATARS = {
  'enter': 'waving.svg',
  'pass': 'peace.svg',
  '*': 'cheer.svg',
};

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);


export default class BasicStateMachine {
  constructor(script) {
    this.states = [['main', 0]];
    this.precision = 0;

    this.lex = {
      '*': c => false,
      'enter': c => c.intent === 'enter',
      'pass': c => c.score <= this.precision,
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
        throw new Error(`maybe infinite loop at ${code}, state=${state}`);
      }

      lastIndex = this.states.length - 1;
      [table, state] = this.states[lastIndex];
      pos = this._assignPos(code, table, state);
      this.states[lastIndex] = [table, STATE_TABLES[table][pos][state]];
      state = this.states[lastIndex][1];
      console.log("st=", table, state, "pos=", pos)

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