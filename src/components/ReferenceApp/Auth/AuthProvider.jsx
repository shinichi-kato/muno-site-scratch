/*
mock auth
*/


import React, { createContext } from 'react';

export const AuthContext = createContext();

const initialState = {
  user: {
    displayName: "ゲスト",
    photoURL: "user/boy1/peace.svg",
    uid: "mock_UID_for_guest_user",
  },
  backgroundColor: "#dec28e",
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
        photoURL:state.user.photoURL,
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