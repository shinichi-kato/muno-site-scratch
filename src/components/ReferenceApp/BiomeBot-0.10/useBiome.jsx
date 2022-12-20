import { useReducer, useEffect } from 'react';
import { useCells } from './useCells';
import { db } from '../BiomeBot-0.10/db';

const initialState = {
  status: 'init',
  dir: '',
  mode: '',
  backgroundColor: '',
  spool: {},
  order: {
    'main': [],
    'biome': [],
  },
}


function reducer(state, action) {
  switch (action.type) {
    case 'loading': {
      return {
        ...initialState,
        status: 'loading',
        dir: action.dir,
      }
    }

    case 'main_loaded': {
      return {
        ...state,
        status: 'mainReady',
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
        status: 'ready',
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
        status: 'generator_is_running'
      }
    }

    case 'end_generator': {
      return {
        ...state,
        status: 'ready'
      }
    }

    case 'changeMode': {
      return {
        ...state,
        mode: action.modeName
      }
    }

    case 'hoist': {
      let pos = state.order.indexOf(action.cellName);
      let newOrder = [...state.order.biome];
      if (pos > 0) {
        let removed = newOrder.splice(pos, 1)
        newOrder.unshift(removed[0]);
      }
      return {
        ...state,
        order: {
          'main': state.order.main,
          'biome': newOrder
        }
      }
    }

    case 'drop': {
      let pos = state.order.indexOf(action.cellName);
      let newOrder = [...state.order.biome];
      if (pos !== -1 && pos < newOrder.length - 1) {
        let removed = newOrder.splice(pos, 1);
        newOrder.push(removed[0]);
      }
      return {
        ...state,
        order: {
          'main': state.order.main,
          'biome': newOrder
        }
      }
    }
  }
}

export function useBiome(url) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mainState, mainLoad] = useCells(url);
  const [biomeState, biomeLoad] = useCells();

  useEffect(() => {
    if (mainState.status === 'loaded') {
      const [dir, filename] = splitPath(url);
      dispatch({ type: 'loading', dir: dir });

      const biomeUrls = mainState.cellName.map(filename => `${dir}${filename}`);
      biomeLoad(biomeUrls);
      // この時点でチャットボットはmainのみ返答可能になる
      dispatch({
        type: 'main_loaded',
        spool: mainState.spool,
        order: mainState.cellNames,
        backgroundColor: mainState.spool[mainState.biomes[0]].backgroundColor 
      });

      // db上でmemoryが空の場合、取得したmemoryをコピー
      if(db.isMemoryEmpty()){
        db.putsMemory(mainState.memory);
        db.putsMemory(biomeState.memory);
      }

    }
  }, [mainState.status]);

  useEffect(() => {
    if (biomeState.status === 'loaded') {
      dispatch({
        type: 'biome_loaded',
        spool: biomeState.spool,
        order: biomeState.cellNames
      });

    }
  }, [biomeState.status]);

  function load(url){
    // チャットボットを切り替えるとき用。後で実装
  }

  function changeMode(modeName) {
    dispatch({ type: 'changeMode', modeName: modeName })
  }

  function* cells() {
    if (state.status !== 'ready') return;
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
  }

  function hoist(cellName) {
    if (state.status === 'generator_is_running') {
      throw new Error('関数useBiome.cells()実行中はhoistできません')
    }
    dispatch({ type: 'hoist', cellName: cellName })
  }

  function drop(cellName) {
    if (state.status === 'generator_is_running') {
      throw new Error('関数useBiome.cells()実行中はhoistできません')
    }
    dispatch({ type: 'drop', cellName: cellName })
  }

  return {
    state: state,
    load: load,
    cells: cells,
    changeMode: changeMode,
    hoist: hoist,
    drop: drop,
  }
}

function splitPath(url) {
  const match = url.match("(.+/)(.+?)([\?#;].*)?$")
  return [
    match[1],
    match[2]
  ]
}
