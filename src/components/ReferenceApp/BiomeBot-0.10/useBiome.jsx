import { useReducer, useEffect, useCallback } from 'react';
import { useCells } from './useCells';
import { db } from '../BiomeBot-0.10/db';

const BIOME_LOADING = 0;
export const BIOME_MAIN_READY = 1;
export const BIOME_READY = 2;


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

    case 'update': {
      const cellName = state.order[action.mode][action.index];
      const cell = state.spool[cellName];
      let newOrder = {
        'main': [...state.order.main],
        'biome': [...state.order.biome]
      }

      // hoist/drop
      let pos = state.order.biome.indexOf(cellName);
      let mode = 'biome';
      if (pos === -1) {
        pos = state.order.main.indexOf(cellName);
        mode = 'main';
      }

      if (cell.retention < Math.random()) {
        // drop
        if (pos !== -1 && pos < newOrder.length - 1) {
          let removed = newOrder[mode].splice(pos, 1);
          newOrder[mode].push(removed[0]);
        }
      } else {
        // hoist
        if (pos > 0) {
          let removed = newOrder[mode].splice(pos, 1)
          newOrder[mode].unshift(removed[0]);
        }
      }

      return {
        ...state,
        mode: action.mode,
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
      (async () => {
        await db.open(url);
        await db.appendMemoryItems(mainState.memory);
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
          backgroundColor: mainState.spool[mainCellName].backgroundColor,
        });

      })();

    }
  }
    , [
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
      db.appendMemoryItems(biomeState.memory).then(() => {
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
    biomeState.order,
    biomeState.memory]);

  const load = useCallback(url => {
    // チャットボットを切り替えるとき用。後で実装
    mainLoad(url);
  }, [mainLoad]);

  const update = useCallback((mode, index) => {
    dispatch({type: 'update', mode: mode, index:index})
  }, []);

  return [
    state,
    load,
    update
  ]
}

function getDir(url) {
  const match = url.match(/(.+\/)(.+?)([?#;].*)?$/)
  return match[1];
}
