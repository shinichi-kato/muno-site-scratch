import { useReducer, useEffect, useCallback } from 'react';
import { useCells } from './useCells';
import { db } from '../BiomeBot-0.10/db';

const BIOME_LOADING = 0;
export const BIOME_MAIN_READY = 1;
export const BIOME_READY = 2;
const BIOME_RUN = 3;
const BIOME_GENERATOR_IS_RUNNING = 4;


const initialState = {
  status: 'init',
  isReady: false,
  dir: '',
  mode: 'main',
  backgroundColor: '',
  avatarDir: '',
  spool: {},
  order: {
    'main': [],
    'biome': [],
  },
}


function reducer(state, action) {
  console.log("useBiome reducer", action)
  switch (action.type) {
    case 'loading': {
      return {
        ...initialState,
        status: BIOME_LOADING,
        dir: action.dir,
      }
    }

    case 'main_loaded': {
      return {
        ...state,
        isReady: false,
        status: BIOME_MAIN_READY,
        avatarDir: action.avatarDir,
        backgroundColor: action.backgroundColor,
        spool: {
          ...action.spool
        },
        order: {
          'main': action.order,
          'biome': []
        },
      }
    }

    case 'biome_loaded': {
      return {
        ...state,
        status: BIOME_READY,
        isReady: true,
        spool: {
          ...state.spool,
          ...action.spool,
        },
        order: {
          'main': state.order.main,
          'biome': action.order
        }
      }
    }

    case 'start_generator': {
      return {
        ...state,
        status: BIOME_GENERATOR_IS_RUNNING
      }
    }

    case 'end_generator': {
      return {
        ...state,
        status: BIOME_RUN
      }
    }

    case 'changeMode': {
      return {
        ...state,
        mode: action.modeName
      }
    }

    case 'hoist': {
      // generator実行中はhoist禁止
      if (state.status === BIOME_GENERATOR_IS_RUNNING) {
        throw new Error('関数useBiome.cells()実行中はhoistできません')
      }

      // mainとbiomeのどちらをhoistしたかをcellNameで判別
      let pos = state.order.biome.indexOf(action.cellName);
      let mode = 'biome';
      if (pos === -1) {
        pos = state.order.main.indexOf(action.cellName);
        mode = 'main';
      }
      console.log("pos",pos,"mode",mode,"name",action.cellName)
      let newOrder = {
        'main': [...state.order.main],
        'biome': [...state.order.biome]
      }
      if (pos > 0) {
        let removed = newOrder[mode].splice(pos, 1)
        newOrder[mode].unshift(removed[0]);
      }
      console.log("newOrder",newOrder)
      return {
        ...state,
        order: newOrder
      }
    }

    case 'drop': {
      // generator実行中はhoist禁止
      if (state.status === BIOME_GENERATOR_IS_RUNNING) {
        throw new Error('関数useBiome.cells()実行中はdrop()は使用できません')
      }

      // mainとbiomeのどちらをhoistしたかをcellNameで判別
      let pos = state.order['biome'].indexOf(action.cellName);
      let mode = 'biome';
      if (pos === -1) {
        pos = state.order['main'].indexOf(action.cellName);
        mode = 'main';
      }
      let newOrder = {
        'main': [...state.order.main],
        'biome': [...state.order.biome]
      }
      if (pos !== -1 && pos < newOrder.length - 1) {
        let removed = newOrder[mode].splice(pos, 1);
        newOrder[mode].push(removed[0]);
      }
      return {
        ...state,
        order: newOrder
      }
    }

    default:
      throw new Error(`invalid action.type ${action.type}`);
  }
}

export function useBiome(url) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mainState, mainLoad] = useCells(url);
  const [biomeState, biomeLoad] = useCells();

  useEffect(() => {
    if (mainState.status === 'loaded' && biomeState.status === 'init') {
      db.open(url).then(() => {
        db.appendMemoryItems(mainState.memory);

        const dir = getDir(url);
        dispatch({ type: 'loading', dir: dir });

        const mainCellName = mainState.cellNames[0];
        const biomeUrls = mainState.biomes[mainCellName].map(filename => `${dir}${filename}`);
        biomeLoad(biomeUrls);
        // この時点でチャットボットはmainのみ返答可能になる
        dispatch({
          type: 'main_loaded',
          avatarDir: mainState.spool[mainCellName].avatarDir,
          spool: mainState.spool,
          order: mainState.cellNames,
          backgroundColor: mainState.spool[mainCellName].backgroundColor
        });
      })
    }
  }, [
    url,
    mainState.status,
    biomeState.status,
    biomeLoad,
    mainState.biomes,
    mainState.cellNames,
    mainState.spool,
    mainState.memory,
  ]);

  useEffect(() => {
    if (biomeState.status === 'loaded') {
      db.open(url)
        .then(() => {
          dispatch({
            type: 'biome_loaded',
            spool: biomeState.spool,
            order: biomeState.cellNames
          });

        })
    }
  }, [url,
    biomeState.status,
    biomeState.cellNames,
    biomeState.spool,
    biomeState.order]);

  const load = useCallback(url => {
    // チャットボットを切り替えるとき用。後で実装
    mainLoad(url);
  }, [mainLoad]);

  const changeMode = useCallback((modeName) => {
    dispatch({ type: 'changeMode', modeName: modeName })
  }, []);

  const cells = useCallback(function* () {
    if (state.status !== BIOME_READY) return;
    let cellName;
    let currentMode;

    dispatch({ type: 'start_generator' });

    while (state.mode !== currentMode) {
      currentMode = state.mode;
      for (cellName of state.order[state.mode]) {
        if (state.mode !== currentMode) {
          break;
        }
        yield state.spool[cellName];
      }
    }
    dispatch({ type: 'end_generator' })
  }, [state.status, state.mode, state.spool, state.order]);

  const exitCells = useCallback(() => {
    dispatch({ type: 'end_generator' })
  }, []);

  const hoist = useCallback((cellName) => {
    dispatch({ type: 'hoist', cellName: cellName })
  }, []);

  const drop = useCallback((cellName) => {
    dispatch({ type: 'drop', cellName: cellName })
  }, []);

  return [
    state,
    load,
    cells,
    exitCells,
    changeMode,
    hoist,
    drop,
  ]
}

// function splitPath(url) {
//   const match = url.match(/(.+\/)(.+?)([?#;].*)?$/)
//   return [
//     match[1],
//     match[2]
//   ]
// }

function getDir(url) {
  const match = url.match(/(.+\/)(.+?)([?#;].*)?$/)
  return match[1];
}
