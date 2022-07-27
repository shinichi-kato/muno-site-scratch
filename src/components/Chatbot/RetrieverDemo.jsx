/*
RetrieverDemo
==================

TFIDFでテキスト類似度を計算するデモ

*/

import React, { useState, useEffect } from 'react';
import { withPrefix } from 'gatsby';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import Input from '@mui/material/Input';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';

import { matrixize } from './matrixize';
import { textScore } from './retrieve';
import { TableRow } from '@mui/material';


export default function RetrieverDemo({ source }) {
  const [table, setTable] = useState([]);
  const [message, setMessage] = useState(null);
  const [cache, setCache] = useState({ status: "unload", source: null });
  const [userText, setUserText] = useState("");
  const [targetText, setTargetText] = useState("");

  // --------------------------------------------
  // スクリプトのロード

  useEffect(() => {
    if (cache.status === 'unload') {
      setMessage("読み込み中 ...")
      fetch(withPrefix(source))
        .then(res => res.json())
        .then(
          result => {
            setMessage("計算中 ...")
            
            let data = matrixize(source, result.script);
            let inscript = [];
            for(let i=0,l=data.inScript.length; i<l; i++){
              let row = data.inScript[i];
              for(let i2=0,l2=row.length; i2<l2; i2++){
                inscript.push(row[i2])
              }
            }
            data.inScript=inscript;
            setCache(data);
            setMessage(null);
          },
          error => {
            setMessage(error.message);
          }
        )
    }
  }, [cache.status, cache.source, source]);

  // ---------------------------------------
  // 開始時にscoreからのテーブルを生成
  //

  useEffect(() => {
    if (cache.status === 'loaded') {
      setTable(cache.inScript.map(node => ({ text: node, score: "" })));
      setCache(prev => ({
        ...prev,
        status: 'ok'
      }))
    }
  }, [cache, cache.status]);


  function handleChangeInput(event) {
    setUserText(event.target.value);
  }

  function handleSubmit(event) {
    let scores = textScore(userText, cache);
    
    setTargetText(userText);
    setTable(scores);
    setUserText("");

    event.preventDefault();
  }


  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: "#dddddd",
        p: 1,
        borderRadius: 3,
        marginBottom: 2,
        marginTop: 1
      }}
    >
      {message
        ?
        <Box>{message}</Box>
        :
        <TableContainer component={Box}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>行番号</TableCell>
                <TableCell>辞書</TableCell>
                <TableCell>類似度</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {table.map((row, index) => (
                <TableRow
                  key={index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{index}</TableCell>
                  <TableCell>{row.text}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "5rem",
                        textAlign: "center",
                        background: `linear-gradient(to right, #1e5799 ${row.score*100}%, #999999 ${row.score*100}%, #999999 ${row.score*100}%);`
                      }}
                    >
                      {`${parseInt(row.score * 100)} %`}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      }
      <Box>
        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row"
            }}
          >
            <Box>
              <Input
                value={userText}
                onChange={handleChangeInput}
                disabled={cache.status !== 'ok'}
              />
            </Box>
            <Box>
              <IconButton>
                <SendIcon />
              </IconButton>
            </Box>
            <Box 
              sx={{
                textAlign: "right",
                flex: 1,
                paddingRight: 3
                }}>計算対象の文字列：{targetText}</Box>
          </Box>
        </form>
      </Box>
    </Box>
  )
}