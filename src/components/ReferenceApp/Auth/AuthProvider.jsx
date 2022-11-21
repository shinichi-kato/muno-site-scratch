/*
mock auth
*/


import React, { createContext, useReducer } from 'react';

export const AuthContext = createContext();

const initialState = {
  user: {
    displayName: "ゲスト",
    photoURL: "",
    uid: "mock_UID_for_guest_user",
  },
  backgroundColor: null,
  page: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'init': {
      return {
        ...initialState
      }
    }

    case 'toUpdate': {
      return {
        ...state,
        page: 'update'
      }
    }
  }
}

export default function AuthProvider(props) {
  const [state, dispatch] = useRecuder(reducer, initialState);

  function openUpdateDialog() {
    dispatch({ type: 'toUpdate' });
  }


  return (
    <AuthContext.Provider
      value={{
        displayName: state.user.displayName,
        authState: 'ok',
        backgroundColor: state.backgroundColor,
        uid: state.user.uid,
        openUpdateDialog: openUpdateDialog,
      }}
    >
      {
        state.page !== false
          ?
          <AuthDialog
            state={state}
            updateUserInfo={updateUserInfo}
          />
          :
          props.children
      }

    </AuthContext.Provider>
  )
}