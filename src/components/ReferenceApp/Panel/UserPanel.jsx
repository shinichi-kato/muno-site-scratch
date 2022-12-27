import React, {useContext} from "react";
import Box from '@mui/material/Box';
import { AuthContext } from "../Auth/AuthProvider";


export default function UserPanel(props) {
  const auth = useContext(AuthContext);
  const width = props.panelWidth;
  const height = width * 4/3;

  return (
    <Box
      sx={{
        width: width,
        height: height,
      }}
      position="relative">
      <Box
        sx={{
          width: width,
          height: width,
          borderRadius: "100% 0% 0% 100% / 100% 100% 0% 0%",
          backgroundColor: `${auth.backgroundColor}`
        }}
        position="absolute"
        bottom={0}
        right={0}
      />
      <Box sx={{
        width: width,
        height: height,
        p:0, m:0
      }}
        position="absolute"
        bottom={0}
        right={0}
      >
        <img
          style={{
            width: width,
            height: height,
          }}
          src={auth.photoURL}
          alt={auth.photoURL} />
      </Box>

    </Box>

  )
}