## タスクその1
GLSLのサンプルを動かしてみて、頂点シェーダとフラグメントシェーダを試してみる

### 補足説明
#### index.html
- canvasタグ
  - GPUを使ったレンダリングには、描画対象のスクリーンが必要となる。具体的には、HTMLの`canvas`タグが必要となるため、定義されている。
- scriptタグ
  - 頂点シェーダ/フラグメントシェーダの定義が書かれている。実際に利用されるのはJS内のWebGL API呼び出し内。
  - 特段大規模な開発は想定していないので、scriptタグ内で定義している。

#### scripts.js
- シェーダの読み込み
  - index.htmlで定義した頂点シェーダとフラグメントシェーダを、実際にGPUにUpload&Compileする

```JS
// シェーダーを作成
var shader = gl.createShader(gl.VERTEX_SHADER); // 頂点シェーダ作成
gl.shaderSource(shader, source); // scriptタグで定義したシェーダ文字列(=source)をGPUにUpload。
gl.compileShader(shader); // Compile
```


##参考
https://webglfundamentals.org/webgl/lessons/ja/webgl-fundamentals.html
