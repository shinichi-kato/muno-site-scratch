/*

central state machine 1

================================
在室/不在及び名付けに対応したメインセル

この状態機械は PatternEncoderによりコード化されたユーザ入力を受取り、
内部状態を保持しつつ

1. チャットボットが不在の状態で名前を呼ばれたら現れる
2. チャットボットが不在状態になる
3. ユーザがチャットボットにニックネームをつけたら確認して記憶する
4. ニックネームや名前を呼ばれたらチャットボットがbiomeモードになる
5. 
という動作を行う。

このstatemachineは以下の中間コードを受け入れる
{
      intent: ,
      index: ,
      score: float,
      harvests: [],
      text: text,
      status: "ok",
}

このstateMachineは以下の処理結果を返す。
{
  intent:
  index:
  score:
  harvests:
  text
  status: 
  avatar
  command
}

■ main→biome遷移
状態遷移の中で「to_biome」という状態は、他のどの遷移も起きない場合、
つまりpos=='*'で遷移する。biome側での状態は各状態機械の状態とCellOrder
が保持されることで以前の続きから動作をする。

■ biome→main遷移
biomeの動作ですべてのcellがprecisionチェックでNGとなった場合、
biome→main遷移を行う。「すべてのcellがprecisionチェックでNG」という
状態はnot_found似相当するため、to_biomeの次はnot_foundになるものとする。
これによりnot_found処理をmain側で一元的に扱う。


この状態機械の挙動はENBF記法で記述した。これは
https://www.bottlecaps.de/rr/ui で可視化可能である。
-------------------------------------------------------------

main::= ('enter'|('absent' 'stand_by'* 'summon'))
        (( to_biome 'not_found'?)|bot_namer)* 'exit'
bot_namer::='B_naming' 'B_renaming'* ('B_confirm'|'B_break')

------------------------------------------------------------
*/

import { parseTables, dispatchTables } from './phrase-segmenter';
import BasicStateMachine from './basic-state-machine';

const STATE_TABLES = parseTables({
  main: [
    //            0  1  2  3  4  5  6  7  8  9 10
    '*          : 0  0  0  0  0  0  7  0  0  0  0',
    'enter      : 2  0  0  0  0  0  0  0  0  0  0',
    'absent     : 3  0  0  0  0  0  0  0  0  0  0',
    'std_by     : 0  0  0  4  4  0  0  0  0  0  0',
    'summon     : 0  0  0  5  5  0  0  0  0  0  0',
    'to_biome   : 0  0  6  0  0  6  0  6  6  6  0',
    'bot_namer  : 0  0  9  0  0  9  0  9  9  9  0',
    'not_found  : 0  0  0  0  0  0  0  8  0  0  0',
    'exit       : 0  0 10  0  0 10  0 10 10 10  0',
  ],
  bot_namer: [
    //             0  1  2  3  4  5
    '*           : 0  0  0  0  1  1',
    'B_naming    : 2  0  0  0  0  0',
    'B_renaming  : 0  0  3  3  0  0',
    'B_confirm   : 0  0  4  4  0  0',
    'B_break     : 0  0  5  5  0  0',
  ],
});

const AVATARS = {
  '*': 'peace',
  'enter': 'waving',
  'std_by': 'absent',
  'absent': 'absent',
  'summon': 'waving',
  'to_biome': 'peace',
  'bot_namer': 'peace',
  'not_found': 'peace',
  'exit': 'waving',
};

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);

export default class CentralStateMachine1 extends BasicStateMachine {
  constructor(script) {
    super(script);
    this.refractCount = 0;

    this.lex = {
      '*': c => false,
      'enter': c => c.intent === 'enter',
      'absent': c => c.intent === 'absent',
      'std_by': c => c.intent !== 'summon',
      'summon': c => { this.refractory < 1 && c.intent === 'summon' },
      'to_biome': c => c.score <= this.precision,
      'not_found': c => c.score <= this.precision,
      'exit': c => c.intent === 'exit',
      'bot_namer': c => c.intent === 'bot_naming',

      'B_naming': c => c.intent === 'bot_naming',
      'B_renaming': c => c.intent === 'bot_renaming',
      'B_confirm': c => c.intent === 'bot_confirm',
      'B_break': c => c.intent !== 'bot_renaming' && c.intent !== 'bot_confirm',
    };


  }


  learn(script){
    this.precision = script.precision;
    this.refractory = script.refractory || 4; // exitしたあとの不応期
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
        throw new Error(`infinite loop detected at ${code}`);
      }

      lastIndex = this.states.length - 1;
      [table, state] = this.states[lastIndex];
      pos = this._assignPos(code, table, state);
      this.states[lastIndex] = [table, STATE_TABLES[table][pos][state]];
      state = this.states[lastIndex][1];
      console.log("st=", table, state, "pos=", pos)

      if (pos === 'exit'){
        this.refractCount = this.refractory;
      }

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

      if (pos === 'to_biome') {
        // 'from_biome'に進んだ状態でreturn
        this.states = ['main', 8];
        return {
          ...code,
          command: 'to_biome'
        }
      }

      break;
    }

    // 通常の処理
    if (pos === 'std_by'){
      if(this.refractCount>0){
        this.refractCount --;
      }
    }

    if (pos.test(/naming$/)) {
      db.setItem('{LAST}', code.harvests[0]);
    }

    if (pos === 'B_confirm') {
      let last = db.getValues('{LAST}');
      db.addItem('{BOT_NAME}', last[0]);
    }

    return {
      ...code,
      intent: pos,
      avatar: AVATARS[pos]
    }
  }
}