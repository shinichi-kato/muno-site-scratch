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
  setBiomeCell(biomeCell);
  setMain(mainCell);

  for(let cell of cellOrder.biome()){
    code = cell.run(code);
    if(code.intent === 'run biome'){
      cellOrder.changeMode('biome');
    }
  }
*/
class CellOrder {
  constructor() {
    this.spool = {};
    this.order = {
      'main': [],
      'biome': [],
    }
    this.mode = "main";
    this.generator_is_running = false;
  }

  get main(){
    return this.spool[this.order.main[0]];
  }

  setBiome(arr) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はsetBiomeできません')
    }
    for(cell of arr){
      this._add_biome_cell(cell);
    }
  }

  addBiomeCell(cell) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はaddBiomeCellできません')
    }

    this._add_biome_cell(cell);
  }

  _add_biome_cell(cell){
    if(cell.name in this.spool){
      throw new Error(`同じセル ${cell.name} は複数使用できません`)
    }
    this.spool[cell.name] = cell;
    this.order.biome.push(cell.name);
  }
  
  setMainCell(cell) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はsetMainCellできません')
    }
    this.spool[cell.name] = cell;
    this.order.main = [cell];
  }

  changeMode(modeName) {
    this.mode = modeName === 'main' ? 'main' : 'biome';
  }

  *cells(){
    this.generator_is_running = true;
    let cellName;
    let currentMode;

    while(this.mode !== currentMode){
      currentMode = this.mode;
      for(cellName of this.order[this.mode]){
        if(this.mode !== currentMode){
          break;
        }
        yield this.spool[cellName];
      }
    }
    this.generator_is_running = false;
  }

  hoist(cellName) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.cells()実行中はhoistできません')
    }

    function _hoist(order, cellName) {
      let pos = order.indexOf(cellName);
      if (pos > 0) {
        let removed = order.splice(pos, 1);
        order.unshift(removed[0]);
        return true;
      }
      return false;
    }

    // cellをspoolの中から見つけてそのspoolの先頭へ

    // _hoist(this.spool.biome, cell) || _hoist(this.spool.main, cell);

    _hoist(this.order.biome, cellName);

  }

  drop(cellName) {
    if (this.generator_is_running) {
      throw new Error('関数CellOrder.biome実行中はdropできません')
    }

    function _drop(order, cell) {
      let pos = order.indexOf(cell);
      if (pos !== -1 && pos < order.length - 1) {
        let removed = order.splice(pos, 1);
        order.push(removed[0]);
        return true;
      }
      return false;
    }

    // cell をspoolの中から見つけてその末尾に移動
    // _drop(this.spool.biome, cell) || _drop(this.spool.main, cell);

    _drop(this.order.biome, cellName);
  }

}