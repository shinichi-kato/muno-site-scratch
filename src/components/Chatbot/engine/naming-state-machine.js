/*
naming state machine2

名付けをおこなう内的プロセスの状態機械
==========================================

この状態機械は PatternEncoder によりコード化されたユーザの入力を受取り、
内部状態を伴って
1. ユーザがチャットボットにニックネームをつけたら確認して記憶する
2. ニックネームや名前を呼ばれたらチャットボットが答える
3. チャットボットが不在の状態で呼ばれたら現れる
4. ユーザのニックネームを覚えてユーザの呼びかけに使う
という制御を行う。

1-3はnaming-state-machine.jsで実装済みである。4 は以下の会話例をモデルに
考える。

会話例6
bot: userさんのことをなんて呼んだらいいですか？
user: えーっと、しまりすって呼んで？ 
bot: しまりすさんですね！
user: そうそう。

会話例7
user: それじゃあ、私のことはヨーコって呼んで。
bot: はい。

システムは基本的にプッシュダウン・オートマトンであるが、
エンコーダーが決めるコードは文脈によらない一方、状態によって解釈が
変わるため、
状態機械には全てチャットボットの状態のみを表現する。

-------------------------------------------------------------

main::= ('start'|('absent' 'stand_by'* 'summon'))
        ('*'|'not_found'|bot_namer user_namer?|user_namer)* 'bye'
bot_namer::='B_naming' 'B_renaming'* ('B_confirm'|'B_break')
user_namer::='U_naming' 'U_renaming'* ('U_confirm'|'U_break')

------------------------------------------------------------

*/


import { parseTables, dispatchTables } from './phrase-segmenter';
import BasicStateMachine from './basic-state-machine.js';
import { db } from './dbio';

const STATE_TABLES = parseTables({
  main: [
    //            0  1  2  3  4  5  6  7  8  9 10 11
    '*          : 0  0  6  0  0  6  6  6  6  6  6  0',
    'start      : 2  0  0  0  0  0  0  0  0  0  0  0',
    'absent     : 3  0  0  0  0  0  0  0  0  0  0  0',
    'stand_by   : 0  0  0  4  4  0  0  0  0  0  0  0',
    'summon     : 0  0  0  5  5  0  0  0  0  0  0  0',
    'not_found  : 0  0  7  0  0  7  7  7  7  7  7  0',
    'bot_namer  : 0  0  8  0  0  8  8  8  8  8  8  0',
    'user_namer : 0  0  8  0  0 10 10 10  9 10 10  0',
    'bye        : 0  0  0  0  0 11 11 11 11 11 11  0',
  ],
  bot_namer: [
    //             0  1  2  3  4  5
    '*           : 0  0  0  0  1  1',
    'B_naming    : 2  0  0  0  0  0',
    'B_renaming  : 0  0  3  3  0  0',
    'B_confirm   : 0  0  4  4  0  0',
    'B_break     : 0  0  5  5  0  0',
  ],
  user_namer: [
    //             0  1  2  3  4  5
    '*           : 0  0  0  0  1  1',
    'U_naming    : 2  0  0  0  0  0',
    'U_renaming  : 0  0  3  3  0  0',
    'U_confirm   : 0  0  4  4  0  0',
    'U_break     : 0  0  5  5  0  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);

export default class NamingStateMachine extends BasicStateMachine {
  constructor(script) {
    super(script);

    this.lex = {
      '*': c => false,
      'start': c => c.intent === 'start',
      'absent': c => c.intent === 'absent',
      'stand_by': c => c.intent !== 'summon',
      'summon': c => c.intent === 'summon',
      'not_found': c => c.score <= this.precision,
      'bye': c => c.intent === 'bye',
      'bot_namer': c => c.intent === 'bot_naming',
      'B_naming': c => c.intent === 'bot_naming',
      'B_renaming': c => c.intent === 'bot_renaming',
      'B_confirm': c => c.intent === 'bot_confirm',
      'B_break': c => c.intent !== 'bot_renaming' && c.intent !== 'bot_confirm',
      'user_namer': c => c.intent === 'user_naming',
      'U_naming': c => c.intent === 'user_naming',
      'U_renaming': c => c.intent === 'user_renaming',
      'U_confirm': c => c.intent === 'user_confirm',
      'U_break': c => c.intent !== 'user_renaming' && c.intent !== 'user_confirm',
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
      console.log("st=", table, state, "pos=", pos)

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
    if (pos.test(/naming$/)){
      db.setItem('{LAST}', code.harvests[0]);
    }

    if (pos === 'B_confirm') {
      let last = db.getValues('{LAST}');
      db.addItem('{BOT_NAME}', last[0]);
    }

    if (pos === 'U_confirm') {
      let last = db.getValues('{LAST}');
      db.addItem('{USER_NAME}', last[0]);
    }

    return {
      ...code,
      intent: pos
    }

  }

}