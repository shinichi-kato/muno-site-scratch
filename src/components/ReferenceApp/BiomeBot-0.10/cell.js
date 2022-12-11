/*

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

function newModules(name){
    if(name in modules){
        return modules[name];
    }
    throw new Error(`invalid module name ${name}`);
}

export class Cell {
    constructor(fileName, script) {
        if(script){
            this.readJson(script);
        } else {
            this.fileName = fileName; // 
            this.description = "";
            this.updatedAt = None;
            this.creator = "";
    
            this.avatarDir = "";
            this.backgroundColor = "";
    
            this.encoder = "";
            this.stateMachine = "";
            this.decoder = "";
    
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

        this.description = script.description;
        this.updatedAt = script.updatedAt;
        this.creator = script.creator;

        this.avatarDir = script.avatarDir;
        this.backgroundColor = script.backgroundColor;

        this.encoder = new encoder(script);
        this.stateMachine = new stateMachine(script);
        this.decoder = new decoder(script);

        this.precision = script.precision;
        this.retention = script.retention;

        this.biome = [...script.biome];
    }




}