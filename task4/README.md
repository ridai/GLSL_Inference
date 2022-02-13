## タスクその3
### 目的
GLSLのサンプルを動かしてみて、頂点シェーダとフラグメントシェーダを試してみる

### やること

- 課題4: index.jsを改造して以下機能を実装してください。
  - テクスチャの座標系(texcoords)を指定する必要があるので、setTexcoords()関数を完成させてください。
  -

出来上がりのイメージ
<img width="511" alt="スクリーンショット 2022-02-13 17 43 09" src="https://user-images.githubusercontent.com/2268153/153745831-053167ae-1e2e-4815-ab7e-393626fd2e20.png">


* 実装にあたっては、実装内容・補足説明・参考資料を読んで取り組んでください。

---

## 補足説明
- 画像の読み込み時に、CORS errorが発生する
  - ローカルファイルの読み込みを行おうとすることで、セキュリティエラーが発生する可能性がある（特にchrome
  - chromeを使う場合は、一回chromeを落としてから、ターミナルから以下コマンドで起動するとCORS errorを回避できる
  ```open /Applications/Google\ Chrome.app/ --args --allow-file-access-from-files --user-data-dir```

---

## 参考資料
https://webglfundamentals.org/webgl/lessons/ja/webgl-fundamentals.html
