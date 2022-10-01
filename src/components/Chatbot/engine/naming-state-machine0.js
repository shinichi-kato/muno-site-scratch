/*
naming state machine

名付けをおこなう内的プロセスの状態機械
==========================================

この状態機械は PatternEncoder によりコード化されたユーザの入力を受取り、
内部状態を伴って
・ユーザがチャットボットにニックネームをつけたら確認して記憶する
・ニックネームや名前を呼ばれたらチャットボットが答える
・チャットボットが不在の状態で呼ばれたら現れる
という制御を行う。

システムは基本的にプッシュダウン・オートマトンであるが、
エンコーダーが決めるコードは文脈によらない一方、状態によって解釈が
変わるため、
状態機械には全てチャットボットの状態のみを表現する。

-------------------------------------------------------------

main::= ('start'|('absent' 'stand_by'* 'summon'))
        ('*'|'not_found'|'namer')* 'bye'
namer::='naming' 'renaming'* ('confirm'|'break')

------------------------------------------------------------

*/

import { parseTables, dispatchTables } from './phrase-segmenter';
import BasicStateMachine from './basic-state-machine.js';
import { db } from './dbio';

const STATE_TABLES = parseTables({
  main: [
    //            0  1  2  3  4  5  6  7  8  9
    '*          : 0  0  6  0  0  6  6  6  6  0',
    'start      : 2  0  0  0  0  0  0  0  0  0',
    'absent     : 3  0  0  0  0  0  0  0  0  0',
    'stand_by   : 0  0  0  4  4  0  0  0  0  0',
    'summon     : 0  0  0  5  5  0  0  0  0  0',
    'not_found  : 0  0  7  0  0  7  7  7  7  0',
    'namer      : 0  0  8  0  0  8  8  8  8  0',
    'bye        : 0  0  0  0  0  9  9  9  9  0',
  ],
  namer: [
    //           0  1  2  3  4  5
    '*         : 0  0  0  0  1  1',
    'naming    : 2  0  0  0  0  0',
    'renaming  : 0  0  3  3  0  0',
    'confirm   : 0  0  4  4  0  0',
    'break     : 0  0  5  5  0  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);

export default class NamingStateMachine extends BasicStateMachine {
  constructor(script){
    super(script);

    this.lex= {
      '*': c => false,
      'start': c=> c.intent === 'start',
      'absent': c=> c.intent === 'absent',
      'stand_by': c=> c.intent !== 'summon',
      'summon': c=> c.intent === 'summon',
      'not_found': c=> c.score <= this.precision,
      'namer': c=> c.intent === 'naming',
      'naming': c=> c.intent === 'naming',
      'bye': c=>c.intent === 'bye',
      'renaming': c=> c.intent === 'renaming',
      'confirm': c=> c.intent === 'confirm',
      'break': c=>c.intent !== 'renaming' && c.intent !== 'confirm',
    };
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
      console.log("st=",table,state,"pos=",pos)

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

      break;
    }
    
    // 通常の処理
     if(pos === 'renaming' || pos === 'naming'){
      db.setItem('{LAST}', code.harvests[0]);
     }

     if (pos === 'confirm') {
      let last = db.getValues('{LAST}');
      db.addItem('{BOT_NAME}', last[0]);
    }
    
    return {
      ...code,
      intent: pos
    }

  }

}