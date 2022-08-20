/*
Intent Decoderクラス
---------------------------------------

# 概要
intent文字列、harvestを渡すと*部分をharvestで置き換えた
テキストを返す。

    {
      intent: "b_confirm",
      out: ["*さんでいいですか？"],
    },
    {
      intent: "b_*",
      out: [""],
    }
*/