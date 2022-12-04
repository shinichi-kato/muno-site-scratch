/* 

*/

import React, {
  useContext,
  createContext
} from 'react';
import { AuthContext } from "../Auth/AuthProvider";

export const AuthContext = createContext();

export const defaultSettings = {
  botId: null,
  
}

function reducer(state, action){
  
}

export default function BiomeBotProvider(props){
  const [state,dispatch] = useReducer(reducer, initialState);

  return (
    <BiomeBotContext.Provider
      value={{
        execute: handleExecute,
      }}
    >
      {props.children}
    </BiomeBotContext.Provider>
  )
}