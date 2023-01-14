/*

central state machine 1

================================
在室/不在及び名付けに対応したメインcell

この状態機械はABSENT、PRESENTなどの状態から開始可能で、
そのうちのどれを選択するかはmemoryの{ENTER}で決める。

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
状態はnot_found相当するため、to_biomeの次はnot_foundになるものとする。
これによりnot_found処理をmain側で一元的に扱う。


この状態機械の挙動はENBF記法で記述した。これは
https://www.bottlecaps.de/rr/ui で可視化可能である。
-------------------------------------------------------------

main::='enter' ( initial loop* 'exit')+ 
initial::= (('absent' 'std-by'* 'summon')|'appear')
loop     ::= 'to_biome'? ( 'not_found' | bot_namer )
bot_namer::='bot_naming' 'bot_renaming'* ('bot_confirm'|'bot_break')

------------------------------------------------------------
*/

import { randomInt } from "mathjs";
import { parseTables, dispatchTables } from './phrase-segmenter';
import BasicStateMachine from './basic-state-machine';
import { db } from '../../db';

const RE_NAME_TAG = /naming$/;

const STATE_TABLES = parseTables({
  main: [
    //         0  1  2  3  4  5
    '*       : 0  0  0  0  0  0',
    'enter   : 2  0  0  0  0  0',
    'initial : 0  0  3  0  0  3',
    'loop    : 0  0  0  4  4  0',
    'exit    : 0  0  0  5  5  0',
  ],
  initial: [
    //            0  1  2  3  4  5
    '*          : 0  0  0  0  1  1',
    'absent     : 2  0  0  0  0  0',
    'std_by     : 0  0  3  3  0  0',
    'summon     : 0  0  4  4  0  0',
    'appear     : 5  0  0  0  0  0',
  ],
  loop: [
    //            0  1  2  3  4
    '*          : 0  0  0  1  1',
    'to_biome   : 2  0  0  0  0',
    'bot_namer  : 4  0  4  0  0',
    'not_found  : 3  0  3  0  0',
  ],
  bot_namer: [
    //               0  1  2  3  4  5
    '*             : 0  0  0  0  1  1',
    'bot_naming    : 2  0  0  0  0  0',
    'bot_renaming  : 0  0  3  3  0  0',
    'bot_confirm   : 0  0  4  4  0  0',
    'bot_break     : 0  0  5  5  0  0',
  ],
});

const AVATARS = {
  '*': 'peace.svg',
  'appear': 'waving.svg',
  'std_by': 'absent.svg',
  'absent': 'absent.svg',
  'summon': 'waving.svg',
  'to_biome': 'peace.svg',
  'bot_namer': 'peace.svg',
  'not_found': 'peace.svg',
  'bot_naming': 'peace.svg',
  'bot_renaming': 'peace.svg',
  'bot_break': 'down.svg',
  'bot_confirm': 'cheer.svg',
  'exit': 'waving.svg',
};

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);

export default class CentralStateMachine extends BasicStateMachine {
  constructor(script) {
    super(script);
    this.refractCount = 0;
    this.SE_INITIAL = { absent: true, appear: true };

    this.lex = {
      '*': c => false,
      'enter': c => c.intent === 'enter',
      'initial': c => (c.intent in this.SE_INITIAL || this.refractCount > 0),
      'loop': c => c.intent !== 'exit',
      'exit': c => c.intent === 'exit',

      'absent': c => (c.intent === 'absent' || this.refractCount > 0),
      'std_by': c => c.intent !== 'summon',
      'summon': c => (this.refractCount < 1 && c.intent === 'summon'),
      'appear': c => (c.intent === 'appear' && this.refractCount === 0),
      'to_biome': c => (c.intent !== 'bot_namer' || c.score <= this.precision),
      'not_found': c => c.score <= this.precision,
      'bot_namer': c => c.intent === 'bot_naming',

      'bot_naming': c => c.intent === 'bot_naming',
      'bot_renaming': c => c.intent === 'bot_renaming',
      'bot_confirm': c => c.intent === 'bot_confirm',
      'bot_break': c => c.intent !== 'bot_renaming' && c.intent !== 'bot_confirm',
    };


  }


  learn(script) {
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
        throw new Error(`infinite loop detected at pos=${pos}, code=${code.text} ${code.intent}`);
      }
      lastIndex = this.states.length - 1;
      [table, state] = this.states[lastIndex];
      pos = this._assignPos(code, table, state);

      console.log("pos",pos,"table",table,"staet",state)

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

      if (pos === 'enter') {
        const cands = db.getMemoryValues('{ENTER}');
        code.intent = cands[randomInt(cands.length)];
        continue;
      }

      if (pos in STATE_TABLES) {
        this.states.push([pos, 0]);
        continue;
      }

      if (pos === 'to_biome') {
        return {
          ...code,
          command: 'to_biome'
        }
      }

      break;
    }

    // 通常の処理
    if (pos === 'std_by') {
      if (this.refractCount > 0) {
        this.refractCount--;
      }
    } else
      if (pos === 'exit') {
        this.refractCount = this.refractory;
      }

    if (RE_NAME_TAG.test(pos)) {
      db.setMemoryItem('{LAST}', code.harvests[0]);
    }

    if (pos === 'bot_confirm') {
      let last = db.getMemoryValues('{LAST}');
      db.addMemoryItem('{BOT_NAME_SPOKEN}', last[0]);
    }

    const retcode = {
      ...code,
      intent: pos,
      avatar: AVATARS[pos],
      command: null,
    }

    console.log("state machine returns", retcode);

    return retcode;

  }
}