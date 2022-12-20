import { useReducer, useEffect } from 'react';
import { withPrefix } from 'gatsby';
import { db } from './db'

import CentralStateMachine from './engine/central-state-machine';
import PatternEncoder from '../../Chatbot/engine/pattern-encoder';
import HarvestDecoder from './engine/harvest-decoder';
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

function splitPath(url) {
  const match = url.match("(.+/)(.+?)([\?#;].*)?$")
  return [
    match[1],
    match[2]
  ]
}

const initialState = {
  status: 'init',
  cellNames: [],
  spool: {},
  biomes: [],
  memory: {},
};


function reducer(state, action) {
  switch (action.type) {
    case 'loaded': {
      let spool = {};
      let biomes = {};
      let memory = {};
      for (let d of action.data) {
        spool[d.filename] = {
          avatarDir: d.avatarDir,
          backgroundColor: d.backgroundColod,
          encode: code => d.encoder.retrieve(code),
          process: code => createProcess(d.stateMachine.run, code, d.avatarUrl),
          decode: code => d.decoder.render(code),
          precision: d.precision,
          retention: d.retention,
        }

        biomes[d.filename] = [...d.biome];
        memory = merge(memory, d.memory);
      }
      return {
        status: 'loaded',
        cellNames: action.data.map(d => d.filename),
        spool: spool,
        biomes: biomes,
        memory: memory
      }
    }
  }
}

function createProcess(func, code, avatarDir) {
  const result = func(code);
  return {
    ...result,
    avatarUrl: `${avatarDir}${result.avatar}`
  }
}

export function useCells(urls) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function fetchCell(url) {
    const [dir, filename] = splitPath(url);
    fetch(withPrefix(url), {
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => response.json())
      .then((data) => ({
        ...data,
        filename: filename,
      }));
  }

  function load(urls) {
    // duplicate check
    const dups = duplicated(urls.map(url => splitPath(url)[1]));
    if (dups) {
      throw new Error(`セル名 ${dups} は重複して使用できません`)
    }


    Promise.all(urls.map(fetchCell))
      .then(payload => {
        let data = {};
        for (let d of payload) {
          const encoder = newModules(d.encoder);
          const stateMachine = newModules(d.stateMachine || 'BasicStateMachine');
          const decoder = newModules(d.decoder);

          data[d.filename] = {
            avatarDir: d.avatarDir,
            backgroundColor: d.backgroundColod,
            encoder: new encoder(d.script),
            stateMachine: new stateMachine(d.script),
            decoder: new decoder(d.script),

            precision: d.precision,
            retention: d.retention,
            biome: d.biome,
            memory: d.memory
          }
        }
        dispatch({ type: 'loaded', data: data });
      })
      .catch((e) => {
        throw new Error(e)
      })
  }


  useEffect(() => {
    if (typeof urls === 'string') {
      load([urls])
    }
    else if (Array.isArray(urls)) {
      load(urls)
    }
  }, [urls]);

  return [state, load]
}

function duplicated(arr) {
  let d = {};
  for (let x of arr) {
    if (d[x]) {
      return x
    }
    d[x] = true;
  }
  return false;
}

function merge(target, source) {
  /*see: https://qiita.com/riversun/items/60307d58f9b2f461082a */

  const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
  let result = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    for (const [sourceKey, sourceValue] of Object.entries(source)) {
      const targetValue = target[sourceKey];
      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        result[sourceKey] = targetValue.concat(...sourceValue);
      }
      else {
        Object.assign(result, { [sourceKey]: sourceValue });
      }
    }
  }
  return result;
}