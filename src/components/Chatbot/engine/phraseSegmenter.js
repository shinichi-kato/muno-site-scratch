/*
phraseSegmenter

簡易な文節区切り
=====================

BNF記法でしめす。(https://www.bottlecaps.de/rr/ui)

main ::= indep* '*'+ (indep* '*'+)* person_suffix? (subj|obj|dest|mod|by|verb) 'accept()'
subj ::= ('が'|'は'|'と' ) 'subj()'
obj ::= ('を' 'obj()') | ('の' 'mod()' ('こと' ('を' 'obj()'|subj|dest|by) )? )
dest ::= ('に' 'は'?|'まで') 'dest()'
mod ::= ('な'|'だ'|'ね') 'mod()'
by ::= 'で|により|による' 'by()'
verb ::= ('する' | 'し' 'た') 'verb()'

person_suffix::= 'さん'|'君'|'ちゃん'|'先生'
indep::='しかし'|'なので'|'それで'|'、|。|？|！'

*/

import { TinySegmenter } from "../tinysegmenter";



const DI_INDEPS = toTrueDict([
  'しかし', 'それで', 'なので', 'そんな', 'もしも', 'もしかし', 'だが',
  'いや', 'あはは',
  '、', '。', '?', '？', '!', '！',
  '\t' // 終端記号
])
const DI_SUFFIX = toTrueDict([
  'さん', '君', 'ちゃん', '先生', '先輩',
])
const DI_BY = toTrueDict(['で', 'により', 'による', 'によって']);
const DI_GAHA = toTrueDict(['が', 'は', 'と']);
const DI_NADANE = toTrueDict(['な', 'だ', 'ね']);

const DI_TYPES = {
  subj: ['主語', '主者'],
  obj: ['対象語', '対象者'],
  dest: ['目的語', '目的者'],
  mod: ['修飾語', '修飾者'],
  by: ['手段語', '手段者'],
  verb: ['述語', '述者'],
}

const STATE_TABLES = parseTables({
  main: [
    //       0  1  2  3  4  5  6  7  8  9 10 11
    '*     : 3  0  3  3  0 11 11 11 11 11 11  0',
    'indep : 2  0  2  2  0  0  0  0  0  0  0  0',
    'suf   : 0  0  0  4  0  0  0  0  0  0  0  0',
    'subj  : 0  0  0  5  5  0  0  0  0  0  0  0',
    'obj   : 0  0  0  6  6  0  0  0  0  0  0  0',
    'dest  : 0  0  0  7  7  0  0  0  0  0  0  0',
    'mod   : 0  0  0  8  8  0  0  0  0  0  0  0',
    'verb  : 0  0  0  9  9  0  0  0  0  0  0  0',
    'by    : 0  0  0 10 10  0  0  0  0  0  0  0',
  ],
  subj: [
    //       0  1  2  3  4  5
    '*     : 0  0  5  5  5  1',
    'が    : 2  0  0  0  0  0',
    'は    : 3  0  0  0  0  0',
    'と    : 4  0  0  0  0  0',
  ],
  obj: [
    //       0  1  2  3  4  5  6  7  8  9 10 11 12
    '*     : 0  0  3  1  5  1  7  0  9  1  1  1  1',
    'を    : 2  0  0  0  0  0  0  8  0  0  0  0  0',
    'の    : 4  0  0  0  0  0  0  0  0  0  0  0  0',
    'こと  : 0  0  0  0  0  6  0  0  0  0  0  0  0',
    'subj  : 0  0  0  0  0  0  0 10  0  0  0  0  0',
    'dest  : 0  0  0  0  0  0  0 11  0  0  0  0  0',
    'by    : 0  0  0  0  0  0  0 12  0  0  0  0  0',
  ],
  dest: [
    //       0  1  2  3  4  5
    '*     : 0  0  5  5  5  1',
    'に    : 2  0  0  0  0  0',
    'は    : 0  0  3  0  0  0',
    'まで  : 4  0  0  0  0  0',
  ],
  mod: [
    //       0  1  2  3  4  5
    '*     : 0  0  5  5  5  1',
    'な    : 2  0  0  0  0  0',
    'だ    : 3  0  0  0  0  0',
    'ね    : 4  0  0  0  0  0'
  ],
  by: [
    //       0  1  2  3
    '*     : 0  0  3  1',
    'で    : 2  0  0  0',
  ],
  verb: [
    //       0  1  2  3  4  5
    '*     : 0  0  5  0  5  1',
    'する  : 2  0  0  0  0  0',
    'し    : 3  0  0  0  0  0',
    'た    : 0  0  0  4  0  0',
  ],
});

const DISPATCH_TABLES = dispatchTables(STATE_TABLES);

const LEX = {
  '*': n => false,
  'indep': n => n in DI_INDEPS,
  'subj': n => n in DI_GAHA,
  'obj': n => n === 'を' || n === 'の',
  'dest': n => n === 'に' || n === 'まで',
  'mod': n => n in DI_NADANE,
  'verb': n => n === 'する' || n === 'し',
  'suf': n => n in DI_SUFFIX,
  'by': n => n in DI_BY,
  'が': n => n === 'が',
  'は': n => n === 'は',
  'と': n => n === 'と',
  'で': n => n in DI_BY,
  'を': n => n === 'を',
  'の': n => n === 'の',
  'こと': n => n === 'こと' || n === '事',
  'に': n => n === 'に',
  'な': n => n === 'な',
  'だ': n => n === 'だ',
  'ね': n => n === 'ね',
  'する': n => n === 'する',
  'し': n => n === 'し',
  'た': n => n === 'た',
  'まで': n => n === 'まで',
};

function assignPos(node, currentState) {
  const [table, state] = currentState;

  for (let st in DISPATCH_TABLES[table][state]) {
    if (LEX[st](node)) {
      return st
    }
  }
  return '*'
}

class Fruit {
  constructor() {
    this.surfaces = [];
    this.type = null;
    this.person = 0;
  }
}

export default class PhraseSegmenter {
  constructor() {
    this.segmenter = new TinySegmenter();
  }

  convert(fruit) {
    const surface = fruit.surfaces.join("");
    if (fruit.type === null) {
      return false;
    }
    if (fruit.type === 'posses') {
      return "continue";
    }

    const nodeType = DI_TYPES[fruit.type][fruit.person];
    return `${surface}\t${nodeType}`;
  }

  segment(inputText) {

    let nodes = this.segmenter.segment(inputText);
    let line = [];
    let buff = [];
    let fruit = new Fruit();
    let states = [['main', 0]];
    let pos, table, state;

    nodes.push('\t'); //状態遷移が中途にならないよう終端記号を追加

    for (let node of nodes) {
      let loop = 0;
      while (true) {
        loop++;
        if (loop > 100) {
          throw new RangeError(`loop counter exceeded at ${node}`)
        }

        [table, state] = states[states.length - 1];
        pos = assignPos(node, states[states.length - 1]);
        states[states.length - 1] = [table, STATE_TABLES[table][pos][state]];
        state = states[states.length - 1][1];
        console.log('node=', node, pos, 'state[-1]=', table, state)

        if (state === 0) {
          fruit = new Fruit();
          line = line.concat(buff);
          buff = [];
          states = [['main', 0]];
          continue
        }

        if (state === 1) {
          states.pop()
          continue;
        }

        if (pos in STATE_TABLES) {
          states.push([pos, 0]);
          continue;
        }

        if (table === 'main' && state === 11) {
          let newNode = this.convert(fruit)
          console.log("accept", newNode)
          if (newNode) buff = [newNode];
          continue;
        }

        if (table === 'subj' && state === 4) {
          fruit.type = 'subj';
          continue;
        }

        if (table === 'obj') {
          if (state === 3 || state === 9) {
            fruit.type = 'obj';
          } if (state === 5) {
            fruit.type = 'mod';
          } else {
            break;
          }
          continue;
        }

        if (table === 'dest' && state === 4) {
          fruit.type = 'dest';
          continue;
        }

        if (table === 'mod' && state === 3) {
          fruit.type = 'mod';
          continue;
        }

        if (table === 'by' && state === 3) {
          fruit.type = 'by';
          continue;
        }

        if (table === 'verb' && state === 5) {
          fruit.type = 'verb';
          continue;
        }

        break;
      }

      if (pos === 'indep') {
        //透過
        line.push(node)
        continue;
      }

      buff.push(node)
      fruit.surfaces.push(node)

      console.log("check", table === 'main', state === 4)
      if (table === 'main' && state === 4) {
        fruit.person = 1;
        continue;
      }
    }
    line = line.concat(buff);
    line.pop(); // 終端記号を除去
    return line;
  }
}


function parseTables(tables) {

  let dict = {};
  for (let table in tables) {
    dict[table] = {};

    let d = dict[table];

    for (let line of tables[table]) {
      const [key, elems] = line.split(':');
      d[key.replace(/ /g, '')] =
        elems.replace(/ {2}/g, ' ')
          .replace(/(^ +| +$)/, '')
          .split(' ')
          .map(elem => Number(elem));
    }
  }

  return dict;
}

function dispatchTables(tables) {
  let dict = {};
  for (let table in tables) {
    dict[table] = dispatch(tables[table])
  }
  return dict;
}

function dispatch(table) {
  /* 遷移表からディスパッチテーブルを生成 */
  const rt = table["*"].map(c => { return {} });
  for (let k in table) {
    for (let i in table[k]) {
      let v = table[k][i];
      if (v !== 0) {
        rt[i][k] = v;
      }
    }
  }
  return rt;
}

function toTrueDict(list) {
  let dict = {}
  for (let n of list) {
    dict[n] = true;
  }
  return dict;
}
