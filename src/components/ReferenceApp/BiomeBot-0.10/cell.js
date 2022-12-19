/*
  scriptの形式
  {
    name: セルの名前 
    description: セルの説明(会話には使用しない)
    updatedAt: スクリプトが更新された日付(会話には使用しない)
    creator: スクリプトの製作者(会話には使用しない)

    avatarDir: アバターを格納したurlのディレクトリ名
    backgroundColor: 吹き出しとアバターの背景色

    encoder: エンコーダーのインスタンス
    stateMachine: 状態機械のインスタンス
    decoder: デコーダーのインスタンス

    precision: このセルが反応するスコアの最小値
    retention: このセルが優先して返答を行う持続時間を決める確率

    biome: このセルの中で「to_biome」が実行された場合に使用される
           cellのリスト。
    script: 返答用辞書
  }

*/
import CentralStateMachine from './engine/central-state-machine';
import PatternEncoder from '../../Chatbot/engine/pattern-encoder';
import HarvestDecoder from '../../Chatbot/engine/harvest-decoder';
import BasicStateMachine from './engine/basic-state-machine';

const modules = {
  'PatternEncoder': PatternEncoder,
  'CentralStateMachine': CentralStateMachine,
  'BasicStateMachine': BasicStateMachine,
  'HarvestDecoder': HarvestDecoder,
}

function newModules(name) {
  if (name in modules) {
    return modules[name];
  }
  throw new Error(`invalid module name ${name}`);
}

export class Cell {
  constructor(name, script) {
    if (script) {
      this.name = name;
      this.readJson(script);
    } else {
      this.name = ""; 
      this.avatarDir = "";
      this.backgroundColor = "";

      this.encoder = null;
      this.stateMachine = null;
      this.decoder = null;

      this.precision = 0;
      this.retention = 0;

      this.biome = [];
      this.script = [];
    }
  }

  readJson(script) {
    encoder = newModules(script.encoder);
    stateMachine = newModules(script.stateMachine || 'BasicStateMachine');
    decoder = newModules(script.decoder);

    this.avatarDir = script.avatarDir;
    this.backgroundColor = script.backgroundColor;

    this.encoder = new encoder(script);
    this.stateMachine = new stateMachine(script);
    this.decoder = new decoder(script);

    this.precision = script.precision;
    this.retention = script.retention;

    this.biome = [...script.biome];
  }

  encode(code) {
    /* 入力code:
        {
          intent: string,
          text: ユーザや他チャットボットの発言,
          owner: 'user' or 'bot'
        }

        出力 code:
        {
          intent: string,
          score: float,
          index: int,
        }
    */
  
    return this.encoder.retrieve(code);
  }

  execute(code){
    return this.stateMachine.run(code);
  }

  decode(code){
    return this.decoder.render(code);
  }



}