import React, {
    useState,
    createContext,
    useEffect,
    useReducer
  } from 'react';
  import useInterval from '../use-interval';
  import Container from '@mui/material/Container';
  import { getDateRad, getHourRad } from '../calendar-rad.jsx';
  
  
  export const EcosystemContext = createContext();
  
  const updateInterval = 10*60*1000;

  //                1    2     3    4     5     6     7     8    9    10   11    12   
  const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'winter'];
  
    const SOLTICE = {
    sunrise: {
      summer: {
        dateRad: getDateRad(6, 15), // 夏至の日
        hourRad: getHourRad(5, 0),  // 夏至の日の出時刻
      },
      winter: {
        dateRad: null, // 冬至の日(夏至の半年後)
        hourRad: getHourRad(7, 0), // 冬至の日の出時刻
      },
    },
    sunset: {
      summer: {
        dateRad: null, // winter.dateRadの半年後
        hourRad: getHourRad(19, 0), // 夏至の日没時刻
      },
      winter: {
        dateRad: getDateRad(12, 1), // 冬至の日
        hourRad: getHourRad(17, 0), // 冬至の日没時刻
      },
    }
  };
  
  const CSunset = {
    a: (SOLTICE.sunset.winter.hourRad - SOLTICE.sunset.summer.hourRad) / 2,
    b: (SOLTICE.sunset.winter.hourRad + SOLTICE.sunset.summer.hourRad) / 2,
    t: SOLTICE.sunset.winter.dateRad,
  };
  const CSunrise = {
    a: (SOLTICE.sunrise.summer.hourRad - SOLTICE.sunrise.winter.hourRad) / 2,
    b: (SOLTICE.sunrise.summer.hourRad + SOLTICE.sunrise.winter.hourRad) / 2,
    t: SOLTICE.sunrise.summer.dateRad
  };
  
  
  function getDayPart(now) {
    /* nightOrDay(now) ... nowで与えられたタイムスタンプをmorning/noon/evening/ninghtに変換する
      
      年間を通して日の出、日没の時間は周期的に変化する。これをsinカーブで近似して
      仮想的な昼夜を生成する。
      日の出はsunrise.summer.hourRadを最小値とした一年周期のサインカーブ、
      日没はSUNSET.winter.hourRadを最小値とした一年周期のサインカーブとする。
    */
    if (now === undefined) {
      now = new Date();
    }
    const nowDateRad = getDateRad(now);
  
    const sunset = CSunset.a * Math.cos(nowDateRad + CSunset.t) + CSunset.b;
    const sunrise = CSunrise.a * Math.cos(nowDateRad + CSunrise.t) + CSunrise.b;
    // morning '朝', // 日の出前59分間から日の出240分まで
    // noon '昼', // 日の出241分後〜日没前120分まで
    // evening '夕', // 日没前121分〜日没後60分
    // night '夜', // 日没後61分〜日の出前60分まで
  
    // 1hをhourRadに換算すると = 1 / 24 * 2 * Math.PI = 1 / 12 * Math.PI 
  
    const nightEnd = sunrise - Math.PI / 12;
    const morningEnd = sunrise + Math.PI / 3;
    const noonEnd = sunset - Math.PI / 6;
    const eveningEnd = sunset + Math.PI / 12;
    // const nightStart = eveningEnd;
    // const nightEnd = morningStart; 
  
    const nowHourRad = getHourRad(now);
    if (nowHourRad < nightEnd) return "night";
    if (nowHourRad < morningEnd) return "morning";
    if (nowHourRad < noonEnd) return "noon";
    if (nowHourRad < eveningEnd) return "evening";
    return "night";
  
  }

  const BACKGROUNDS = {
    'morning': 'linear-gradient(3deg, rgba(216,254,254,1) 0%, rgba(182,191,252,1) 100%);',
    'noon': 'linear-gradient(3deg, rgba(217,255,255,1) 0%, rgba(122,206,220,1) 100%);',
    'evening':'linear-gradient(3deg, rgba(245,235,80,1) 0%, rgba(245,171,159,1) 100%);',
    'night':'linear-gradient(3deg, rgba(121,144,144,1) 0%, rgba(33,41,98,1) 100%);',
  }
  
  const initialState = {
    change: null,
  };
  
  function reducer(state, action) {
    switch (action.type) {
      case 'change': {
        return {
          change: action.what,
        }
      }
  
      case 'dispatched': {
        return {
          change: null,
        }
      }
  
      default:
        throw new Error(`invalid action ${action.type}`);
    }
  
  }
  
  export default function EcosystemProvider(props) {
    /*
      EcosystemProviderは
      時間による夜／昼の変化、季節、天候、場所など
      システムの仮想環境を提供する。これらの変化により
      backgroundの画像を変化させ、環境の変化にトリガーした
      メッセージをチャットボットに送る。
  
      ** 夜/昼の変化 dayPart
      日本の平均的な日没・日の出を大雑把に近似した時刻を用いて
      昼夜を切り替える。朝/昼/夕/夜により背景画像は切り替える。 
        morning '朝', // 日の出前59分間から日の出240分まで
        noon '昼', // 日の出241分後〜日没前120分まで
        evening '夕', // 日没前121分〜日没後60分
        night '夜', // 日没後61分〜日の出前60分まで
      
      
      これらの変化が生じたとき、changeに変化した内容が格納される。
      変化したことをconsumer側で利用した後はonChangeAcknowledged()を
      呼ぶことでchangeの内容がリセットされる。
  
    */
  
    const [season, setSeason] = useState(); /* 季節 */
    const [dayPart, setDayPart] = useState(getDayPart(new Date())); /* 昼、夜 */
    const [state, dispatch] = useReducer(reducer, initialState);
  
    //---------------------------------------------------------------------------
    // 
    // 定期的に環境の変化を生成
    //
  
    useEffect(() => {
      console.log("ecosystem changeMonitor: ", state.change);
    }, [state.change])
  
    useInterval(() => {
      const now = new Date();
      const s = SEASONS[now.getMonth()];
      const d = getDayPart(now);
  
      setSeason(prevState => {
        if (prevState !== s) {
          dispatch({type:'change', what:s});
        };
        return s;
      });
  
      setDayPart(prevState => {
        if (prevState !== d) {
          dispatch({type:'change', what:d});
        }
        return d;
      })
  
    }, updateInterval, true);

    return (
      <EcosystemContext.Provider
        value={{
          season: season,
          getDayPart: getDayPart,
          change: state.change,
          dispatch: dispatch
        }}
      >
        <Container
          fixed
          maxWidth="xs"
          disableGutters
          sx={{
            height: "100vh",
            background: BACKGROUNDS[dayPart],
          }}
        >
          {props.children}
  
        </Container>
  
      </EcosystemContext.Provider>
    )
  }