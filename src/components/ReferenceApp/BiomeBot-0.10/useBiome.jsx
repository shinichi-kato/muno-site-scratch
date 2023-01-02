import { useReducer, useEffect, useCallback } from 'react';
import { useCells } from './useCells';
import { db } from '../BiomeBot-0.10/db';

const BIOME_LOADING = 0;
export const BIOME_MAIN_READY = 1;
export const BIOME_READY = 2;
const BIOME_RUN = 3;
const BIOME_CELLS_IS_RUNNING = 4;


const initialState = {
  status: 'init',
  isReady: false,
  dir: '',
  mode: 'main',
  currentMode: '',
  currentCellName: '',
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

    case 'rewind_cells': {
      return {
        ...state,
        status: BIOME_CELLS_IS_RUNNING,
        currentMode: action.mode ? action.mode : state.mode,
        currentIndex: 0
      }
    }


    case 'next_cells': {
      return {
        ...state,
        status: BIOME_CELLS_IS_RUNNING,
        currentMode: state.currentMode + 1,

      }
    }

    case 'exit_cells': {
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
      if (state.status === BIOME_CELLS_IS_RUNNING) {
        throw new Error('関数useBiome.cells()実行中はhoistできません')
      }

      // mainとbiomeのどちらをhoistしたかをcellNameで判別
      let pos = state.order.biome.indexOf(action.cellName);
      let mode = 'biome';
      if (pos === -1) {
        pos = state.order.main.indexOf(action.cellName);
        mode = 'main';
      }
      console.log("pos", pos, "mode", mode, "name", action.cellName)
      let newOrder = {
        'main': [...state.order.main],
        'biome': [...state.order.biome]
      }
      if (pos > 0) {
        let removed = newOrder[mode].splice(pos, 1)
        newOrder[mode].unshift(removed[0]);
      }
      console.log("hoisted: newOrder", mode, newOrder)
      return {
        ...state,
        order: newOrder
      }
    }

    case 'drop': {
      // generator実行中はhoist禁止
      if (state.status === BIOME_CELLS_IS_RUNNING) {
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

  const changeMode = useCallback((modeName) => {
    dispatch({ type: 'changeMode', modeName: modeName })
  }, []);

  const cells = useCallback((type) => {
    // cells(type)
    // type:'start' 初期化
    // type:'next' 次のcellを返す。startまたは前のnextの間にmodeが変更されたら
    //             新たなmodeの先頭のcellを返す
    // type:'exit' 終了

    if (type === 'start') {
      // 初期設定
      dispatch({ type: 'rewind_cells' });
      return
    }

    if (type === 'next') {
      // 前回のcells呼び出しまでにmode変更が起きていなければ
      // {value:現在のcell, done:false} を返す。indexを一つ進める。
      // もしbiome終端にいた場合、modeをmainにする。mainの終端にいた場合
      // {done:true}を返す
      if (state.mode === state.currentMode) {
        if (state.order[state.mode].length < state.currentIndex) {

          const cellName = state.order[state.mode];
          const retval = { value: state.spool[cellName], done: false };
          dispatch({ type: 'next_cells' })
          return retval;

        } else if (state.mode === 'biome') {
          dispatch({ type: 'rewind_cells', mode: 'main' });
        } else if (state.mode === 'main') {
          return { done: true }
        }
        const cellName = state.order[state.mode];
        const retval = { value: state.spool[cellName], done: false };
        dispatch({ type: 'next_cells' })

        return retval;
      }
      else {
        // mainまたはbiomeの先頭に戻ってcellを返す
        const mode = state.mode === 'main' ? 'biome' : 'main';
        dispatch({ type: 'rewind_cells', mode: mode });
        return {
          value: state.spool[state.order[mode][0]],
          done: false
        }
      }

    }

    if (type==='exit'){
      dispatch({type: 'exit_cells'});
    }
  }, [
    state.currentIndex,
    state.currentMode,
    state.mode,
    state.order,
    state.spool
  ]);

  // const cells = useCallback(function* () {
  //   if (state.status !== BIOME_READY) return;
  //   let cellName;
  //   let currentMode;

  //   dispatch({ type: 'start_generator' });

  //   while (state.mode !== currentMode) {
  //     currentMode = state.mode;
  //     for (cellName of state.order[state.mode]) {
  //       if (state.mode !== currentMode) {
  //         console.log("mode changed to",state.mode)
  //         break;
  //       }
  //       yield state.spool[cellName];
  //     }
  //   }
  //   dispatch({ type: 'end_generator' })
  // }, [state.status, state.mode, state.spool, state.order]);


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
