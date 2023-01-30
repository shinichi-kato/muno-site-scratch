import { useReducer, useEffect, useCallback } from 'react';
import { withPrefix } from 'gatsby';
// import { db } from './db'

import CentralStateMachine from './engine/central-state-machine';
import PatternEncoder from './engine/pattern-encoder';
import HarvestDecoder from './engine/harvest-decoder';
import BasicStateMachine from './engine/basic-state-machine';
import EnterlessStateMachine from './engine/enterless-state-machine';
import BowEncoder from './engine/bow-encoder';
import LogEncoder from './engine/log-encoder';

const modules = {
  'BowEncoder': BowEncoder,
  'PatternEncoder': PatternEncoder,
  'LogEncoder': LogEncoder,
  'CentralStateMachine': CentralStateMachine,
  'BasicStateMachine': BasicStateMachine,
  'EnterlessStateMachine': EnterlessStateMachine,
  'HarvestDecoder': HarvestDecoder,
}

function newModules(name) {
  if (name in modules) {
    return modules[name];
  }
  throw new Error(`invalid module name ${name}`);
}

function getFilename(url) {
  const match = url.match(/.*?([^/]+$)/)
  return match[1]
}

const initialState = {
  status: 'init',
  cellNames: [],  // ロードしたcellの名前
  spool: {},
  biomes: [],   // 各cellのbiome(mainのbiomeのみ使用)
  memory: {}
};


function reducer(state, action) {
  switch (action.type) {
    case 'loaded': {
      let spool = {};
      let biomes = {};
      let memory = {};
      for (let d of action.data) {
        spool[d.name] = {
          name: d.name,
          avatarDir: d.avatarDir,
          backgroundColor: d.backgroundColor,
          encoder: d.encoder,
          stateMachine: d.stateMachine,
          decoder: d.decoder,
          precision: d.precision,
          retention: d.retention,
        }

        biomes[d.name] = [...d.biome];
        memory = merge(memory, d.memory);
      }
      return {
        status: 'loaded',
        cellNames: action.data.map(d => d.name),
        spool: spool,
        biomes: biomes,
        memory: memory,
      }
    }

    default:
      throw new Error(`invalid action.type ${action.type}`)
  }
}


export function useCells(cellUrls) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback((urls) => {
    // duplicate check
    const dups = duplicated(urls.map(url => getFilename(url)));
    if (dups) {
      throw new Error(`セル名 ${dups} は重複して使用できません`)
    }


    Promise.all(urls.map(async url => {

      const filename = getFilename(url);
      const response = await fetch(withPrefix(url), {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return {
        ...data,
        filename: filename
      };

    }))
      .then(payload => {
        let data = [];
        for (let d of payload) {
          const encoder = newModules(d.encoder);
          const stateMachine = newModules(d.stateMachine || 'BasicStateMachine');
          const decoder = newModules(d.decoder);

          data.push({
            name: d.filename,
            avatarDir: d.avatarDir,
            backgroundColor: d.backgroundColor,
            encoder: new encoder(d),
            stateMachine: new stateMachine(d),
            decoder: new decoder(d),

            precision: d.precision,
            retention: d.retention,
            biome: d.biome,
            memory: d.memory
          });
        }

        dispatch({ type: 'loaded', data: data });
      })
      .catch((e) => {
        throw new Error(e.message)
      })
  }, []);


  useEffect(() => {
    if (typeof cellUrls === 'string') {
      load([cellUrls])
    }
    else if (Array.isArray(cellUrls)) {
      load(cellUrls)
    }
  }, [cellUrls, load]);

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
