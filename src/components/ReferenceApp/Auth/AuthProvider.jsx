/*
mock auth
*/


import React, { createContext, useReducer } from 'react';

export const AuthContext = createContext();

const initialState = {
  user: {
    displayName: "ゲスト",
    photoURL: "guest",
    uid: "mock_UID_for_guest_user",
  },
  backgroundColor: null,
  page: false,
};

export default function AuthProvider(props) {
  const state = initialState;

  function openUpdateDialog() {};

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
          props.children
      }

    </AuthContext.Provider>
  )
}