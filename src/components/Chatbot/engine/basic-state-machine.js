/*
basic state machine
基本機能だけの内的プロセス状態機械

起動準備ができたらチャットボットに{intent:'start'}が渡される。
それによりチャットボットは'start'状態になり、{intent:'start'}を出力する。
次に任意のユーザ入力を受け取ったらaccept()状態になり、そこでnot_foundか*かの判定を内部で行って
直ちに*、not_found、byeの状態に遷移する。*の場合はinputのintentをそのまま出力する。
not_found,byeの場合はそれぞれnot_found,byeを出力して終わる。
*,not_foundを出力したら次の入力を受け入れる

上述のパース内容は下記にBNF記法で記述した。これはhttps://www.bottlecaps.de/rr/ui
で可視化できる。
--------------------------------------------------------------------------------

main     ::= 'start' 'accept()' ( ( '*' | 'not_found' ) 'accept()' )* 'bye'

--------------------------------------------------------------------------------
*/


import { parseTables, dispatchTables } from './phrase-segmenter';
const STATE_TABLES = parseTables({
  main: [
    //           0  1  2  3  4  5  6
    '*         : 0  0  3  4  3  3  0',
    'start     : 2  0  0  0  0  0  0',
    'not_found : 0  0  0  5  0  0  0',
    'bye       : 0  0  0  6  0  0  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);

const LEX = {
  '*': c => false,
  'start': c => c.intent === 'start',
  'not_found': c => c.intent === 'not_found',
  'bye': c => c.intent === 'bye'
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

export default class BasicStateMachine {
  constructor(script) {
    this.states = [['main', 0]];
    this.learn(script);
  }

  learn(script) {
    this.precision = script.precision;
  }

  run(code) {
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
      // console.log('code=', code, pos, 'states=',this.states)

      if (state === 0) {
        this.states = [['main', 0]];
        continue;
      }

      if (state === 1) {
        this.states.pop();
        continue;
      }

      if (table === 'main' && state === 3) {
        // accept
        if (code.score < this.precision) {
          code.intent = 'not_found'
        }
        console.log("accept",code,this.precision)
        continue;

      }

      break;
    }

    // 通常出力

    if(pos==='*'){
      return code
    }
    return {
      ...code,
      intent: pos
    }
  }
}