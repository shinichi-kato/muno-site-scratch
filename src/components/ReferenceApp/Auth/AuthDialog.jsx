import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import AvatarSelector from './AvatarSelector';
import ColorSelector from '../Editor/ColorSelector';

export default function AuthDialog(props) {
  const page = props.state.page;
  const user = props.state.user;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [backgroundColor, setBackgroundColor] = useState(props.state.backgroundColor);
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");

  function handleChangeDisplayName(event) {
    setDisplayName(event.target.value);
  }

  function handleChangeBackgroundColor(c) {
    setBackgroundColor(c);
  }

  function handleChangePhotoURL(url) {
    setPhotoURL(url);
  }

  return (
    <Grid
      container
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      spacing={4}
    >
      <Grid item xs={12}>
        <TextField
          placeholder="名前"
          value={displayName}
          onChange={handleChangeDisplayName}
          fullWidth
          required
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircleIcon />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <AvatarSelector
          photoURL={photoURL}
          handleChangePhotoURL={handleChangePhotoURL}
          handleChangeBackgroundColor={handleChangeBackgroundColor}
        />
      </Grid>
      <Grid item xs={12}>
        背景の色
        <ColorSelector
          defaultColor={backgroundColor}
          color={backgroundColor}
          handleChange={handleChangeBackgroundColor}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          size="large"
          sx={{
            padding: theme => theme.spacing(2),
            fontSize: 18,
            width: 350,
            borderRadius: '50vh',
          }}
          onClick={handleClick}
        >
          ユーザ情報の更新
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button
          onClick={props.close}>
          閉じる
        </Button>
      </Grid>

    </Grid>
  )
}