/*
phraseSegmenter
*/

import { TinySegmenter } from "../tinysegmenter";



const DI_INDEPS = {
  'しかし': true, 'それで': true, 'なので': true, 'いや': true,
}
const DI_SUFFIX = {
  'さん': true, '君': true, 'ちゃん': true, '先生': true, '先輩': true,
}
const DI_GAHA = { 'が': true, 'は': true };

const DI_TYPES = {
  subj:['主語','主者'],
  obj:['対象語','対象者'],
  dest:['目的語','目的者'],
  mod:['修飾語','修飾者'],
  verb:['述語','述者']
}

const STATE_TABLES = {
  main: [
    //       0  1  2  3  4  5  6  7  8  9
    '*     : 3  0  3  3  0  0  0  0  0  0',
    'indep : 2  0  2  2  0  0  0  0  0  0',
    'suf   : 0  0  0  4  0  0  0  0  0  0',
    'subj  : 0  0  0  5  0  0  0  0  0  0',
    'obj   : 0  0  0  6  0  0  0  0  0  0',
    'dest  : 0  0  0  7  0  0  0  0  0  0',
    'mod   : 0  0  0  8  0  0  0  0  0  0',
    'verb  : 0  0  0  9  0  0  0  0  0  0',
  ],
  subj: [
    //       0  1  2  3
    '*     : 0  0  3  1',
    'がは  : 2  0  0  0',
  ],
  obj: [
    //       0  1  2  3  4  5  6  7  8
    '*     : 0  0  3  1  5  1  0  8  1',
    'を    : 2  0  0  0  0  0  0  0  0',
    'の    : 4  0  0  0  0  0  0  0  0',
    'こと  : 0  0  0  0  0  6  0  0  0',
    'を    : 0  0  0  0  0  0  7  0  0',
  ],
  dest: [
    //       0  1  2  3
    '*     : 0  0  3  1',
    'に    : 2  0  0  0',
  ],
  mod: [
    //       0  1  2  3
    '*     : 0  0  3  1',
    'な    : 2  0  0  0',
  ],
  verb: [
    //       0  1  2  3  4  5
    '*     : 0  0  5  0  5  1',
    'する  : 2  0  0  0  0  0',
    'し    : 3  0  0  0  0  0',
    'た    : 0  0  0  4  0  0',
  ],
};

const DISPATCH_TABLES = dispatch_tables(STATE_TABLES);

const LEX = {
  '*': n => false,
  'indep': n => n in DI_INDEPS,
  'subj': n => n in DI_GAHA,
  'obj': n => n === 'を' || n === 'の',
  'dest': n => n === 'に',
  'mod': n => n === 'な',
  'verb': n => n === 'する' || n === 'し',
  'suf': n => n in DI_SUFFIX,
  'がは': n => n in DI_GAHA,
  'を': n => n === 'を',
  'の': n => n === 'の',
  'こと': n => n === 'こと' || n === '事',
  'に': n => n === 'に',
  'な': n => n === 'な',
  'する': n => n === 'する',
  'し': n => n === 'し',
  'た': n => n === 'た',
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

  convert(fruit){
    const surface = fruit.surfaces.join("");
    const nodeType = DI_TYPES[fruit.type][fruit.person];
    return `${surface}\t${nodeType}`;
  }

  segment(inputText) {

    let nodes = this.segmenter.segment(inputText);
    let line = [];
    let fruit = new Fruit();
    let states = [['main', 0]];

    for (let node of nodes) {
      let loop = 0;
      while (true) {
        loop++;
        if(loop>100){
          throw new RangeError(`loop counter exceeded at ${node}`)
        }

        let currentState = states[states.length-1]
        let [table, state] = currentState;
        let pos = assignPos(node, currentState);
        states[states.length-1] = [table, STATE_TABLES[table][pos][state]];
        state = states[states.length-1][1];

        if (state === 0) {
          fruit = new Fruit();
          line.push(buff);
          buff = [];
          states = [['main', 0]];
          continue
        }

        if (state === 1) {
          states.pop()
        }

        if (pos in STATE_TABLES) {
          states.push([pos, 0]);
          continue;
        }

        if (table==='subj' && state === 4) {
          fruit.type='subj';
          let newNode = this.convert(fruit)
          if (newNode) buff = [newNode];
          continue;
        }
  
        if(table === 'obj'){
          if(state === 3 || state === 8){
            fruit.type='obj';
          } else if (state === 5){
            fruit.type='posses';
          }
          let newNode = this.convert(fruit);
          if(newNode) buff = [newNode];
          continue;
        }
  
        if(table==='dest' && state===3){
          fruit.type='dest';
          let newNode = this.convert(fruit);
          if(newNode) buff = [newNode];
          continue;
        }

        if(table==='mod' && state===3){
          fruit.type='mod';
          let newNode = this.convert(fruit);
          if(newNode) buff = [newNode];
          continue;
        }

        if(table==='verb' && state===5){
          fruit.type='verb';
          let newNode = this.convert(fruit);
          if(newNode) buff = [newNode];
          continue;
        }

        break;
      }

      if (pos === 'indep') {
        //透過
        line.push(node)
      }

      buff.push(node)
      fruit.surfaces.push(node)
      
      if (table==='main' && state === 4){
        fruit.person = 1;
        continue;
      }
    }
    return line;
  }
}


function dispatch_tables(tables) {
  let result = {};
  for (let table in tables) {
    let dict = {};
    for (let table in tables) {
      dict[table] = {};

      let d = dict[table];

      for (let line of tables[table]) {
        const [key, elems] = line.split(':');
        d[key.replace(/ /g, '')] =
          elems.replace(/  /g, ' ').replace(/(^ +| +$)/, '').split(' ');
      }
    }

    result[table] = dispatch(dict[table])
  }

  return result;
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

