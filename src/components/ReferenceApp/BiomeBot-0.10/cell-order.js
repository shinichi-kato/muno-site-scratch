/*
  mainとbiomeの実行順管理
  CellOrderには一つの「mainセル」と複数の「biomeセル」が格納される。
  モードがmainの場合、
  for(let cell of cellOrder.cells()) でcellとしてmainセルが得られる。
  モードがbiomeの場合、
  cellとして格納した順にbiomeセルが得られ、すべてのbiomeセルが得られた
  あとにmainセルが得られる。
  ジェネレータ実行中にcellOrder.changeMode(mode)を実行すると、
  モードをmain,biomeに切り替えることができ、以降のcell of cellOrder.cells()
  で新しいモードのcellが取得できる。

  biomeのセルはhoist(cell)で先頭に、drop(cell)で末尾に移動できるが、
  この２つの関数はgeneratorが実行されている間は利用できない。

  usage:
  let cellOrder = new CellOrder();
  setBiome(['a','b','c']);
  setMain('main');

  for(let cell of cellOrder.biome()){
    code = cell.run(code);
    if(code.intent === 'run biome'){
      cellOrder.changeMode('biome');
    }
  }
*/
class CellOrder {
  constructor() {
    this.spool = {
      'main': [],
      'biome': [],
    };
    this.mode = "main";
    this.generator_is_running = false;
  }

  get main(){
    return this.spool.main[0];
  }

  setBiome(arr) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はsetBiomeできません')
    }
    this.spool.biome = [...arr];
  }

  addBiomeCell(cell) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はaddBiomeCellできません')
    }
    this.spool.biome.push(cell);
  }

  setMainCell(cell) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はsetMainCellできません')
    }
    this.spool.main = [cell];
  }

  changeMode(modeName) {
    this.mode = modeName === 'main' ? 'main' : 'biome';
  }

  *cells(){
    this.generator_is_running = true;
    let cell;
    let currentMode;

    while(this.mode !== currentMode){
      currentMode = this.mode;
      for(cell of this.spool[this.mode]){
        if(this.mode !== currentMode){
          break;
        }
        yield cell;
      }
    }
    this.generator_is_running = false;
  }

  hoist(cell) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はhoistできません')
    }

    function _hoist(spool, cell) {
      let pos = spool.indexOf(cell);
      if (pos > 0) {
        let removed = spool.splice(pos, 1);
        spool.unshift(removed[0]);
        return true;
      }
      return false;
    }

    // cellをspoolの中から見つけてそのspoolの先頭へ

    // _hoist(this.spool.biome, cell) || _hoist(this.spool.main, cell);

    _hoist(this.spool.biome, cell);

  }

  drop(cell) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.biome実行中はdropできません')
    }

    function _drop(spool, cell) {
      let pos = spool.indexOf(cell);
      if (pos !== -1 && pos < spool.length - 1) {
        let removed = spool.splice(pos, 1);
        spool.push(removed[0]);
        return true;
      }
      return false;
    }

    // cell をspoolの中から見つけてその末尾に移動
    // _drop(this.spool.biome, cell) || _drop(this.spool.main, cell);

    _drop(this.spool.biome, cell);
  }

}