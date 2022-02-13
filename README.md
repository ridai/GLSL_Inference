# GLSL_Inference
GLSLを使って、オレオレTensorflow.jsを作って、推論処理を実装してみる

## 目的
- フラグメントシェーダーの記述言語として、GLSLを学んでみる
- GLSLでの処理をハックして、テンソル計算をやってみる
- テンソル計算ができるようになったら、機械学習の推論処理を行う仕組みを作ってみる

## WebGLって？
ブラウザからGPUリソースにアクセスして、3D/2Dの描画(レンダリング処理)を行うためのJavaScript API。

レンダリングを行う対象としては、**点・線・三角形** となっており、それらを組み合わせて描画したいモノの形を定義ができるようになっている。
つまり、複雑なポリゴンを描画したい場合は、三角形の組み合わせ方や配置法則の定義等をWebGLのAPIを介して定義してあげる必要がある。

そして、定義したポリゴンの頂点情報をもとに、頂点シェーダを用いた変形処理(後述)を行う。
また、フラグメントシェーダを用いた画面の色の決定（後述）を行う。
これら、頂点シェーダとフラグメントシェーダの処理は、自前で定義でき、それをWebGLのAPIを介して呼び出すことで任意の画像を描画できるようになっている。

- [参考](https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL)

### シェーダー
グラフィックスカードの実行のためのコードと命令が含まれたアセットのこと。
そもそも、GPUは一般的に3Dのオブジェクトに対して、以下の2フェーズの処理を行なっている。
このフェーズ内で、シェーダーを用いている。
特に、頂点シェーダ・フラグメントシェーダ・ジオメトリシェーダは、ユーザ定義可能なシェーダとして、プログラマブルシェーダと呼ばれる。

- 頂点パイプライン
  - 頂点シェーダー
    - 頂点単位での陰影処理
  - テッセレーション
    - LOD(Level Of Details)処理として、頂点の分割計画/分割/意味付けを行う
  - ジオメトリシェーダ
    - 頂点の増減を動的に実施

- ラスタライズ
  - 3Dのポリゴンをカメラを通して見た2D画面上にどう映るかを計画し、2D情報に切り取る

- ピクセルパイプライン
  - フラグメントシェーダ（ピクセルシェーダ)
    - ピクセル単位の陰影処理
    - テクスチャの適用
  - レンダーバックエンド
    - ステンシル処理等

上記処理の詳細は割愛するが、昔は全てハードウェアでカバーされ、機能のUpdateと共にハードウェアの買い替えが必要であった。
近年は、シェーダはユーザがプログラムで定義できるようになり、さまざまな3D/2D表現ができるようになった。

![アイコン作成じょ](https://user-images.githubusercontent.com/2268153/153739271-a5cfc99c-b84c-46d3-b1aa-e51f69d48e9d.png)

## GLSLって？
頂点シェーダ・フラグメントシェーダの記述が可能なC言語ベースの言語。
GLSLでは、上記2つのシェーダを合わせて「プログラム」とよぶ。

### 頂点シェーダでやること
頂点情報(x, y, z座標を持つベクトル)1つ1つに処理を実行する機構
この時、頂点情報は、 **クリップ空間**と呼ばれる、描画ように切り出された領域を表す数字で表現される。 この数値は、キャンバスのサイズ関係なく、`-1 ~ 1`の間の値をとる。

つまり、「元となる頂点情報」に対応する「クリップ空間上の値」を、 何らかの計算をして求め、その値を特別な変数である「**gl_Position**」に書き込むこと。

```c
// 入力として、4次元(x,y,z,w)の頂点情報を受け取る
attribute vec4 a_position;
 
// 全てのシェーダーは「main」の関数が必要
void main() {
 
  // gl_Positionを得ることが頂点シェーダの目的
  // ここでは、入力のベクトルをそのまま返しているだけ。
  gl_Position = a_position;
}
```

### フラグメントシェーダでやること
描画する2D画面の各ピクセル単位に、テクスチャ適用、陰影計算を行い、実際の色を出力するための処理を実行する機構
具体的には、ピクセル単位で色を計算して、その値を特別な変数である「**gl_FragColor**」に書き込むこと。

ピクセル単位の膨大な計算が必要ではあるが、GPUの力を使うことで並列・高速化を実現させる。

```c
precision mediump float;

// 全てのシェーダーは「main」の関数が必要
void main(void){
  // ターゲットとしているピクセルの位置を取得し、512.0(ディスプレイサイズ)で割ることで、0~1の間の値に縮尺を変える
  float a = gl_FragCoord.x / 512.0;

  // gl_FragColorを得ることがフラグメントシェーダの目的
  // ここでは、左から右にかけて赤色のグラデーションが行われるように各ピクセル色が得られる
  gl_FragColor = vec4(a, 0.0, a, 1.0);
}
```

## GLSLを使ってテンソル計算するとは？
普通、GLSLではピクセル単位にテクスチャを適用し、光源や法線マップに従った陰影処理を行う。

中でも、テクスチャを適用する処理に着目する。
テクスチャ自体は、色情報(RGBa)を定義する2次元の配列データであるため、このデータをテンソル計算の入力と見立てる。
そして、テクスチャの乗算処理を行う行うことで、テンソル計算と同等の結果を得る。

![20180504182318](https://user-images.githubusercontent.com/2268153/153717658-311ec0a1-95e9-4010-8849-aaf678bc2a09.png)

当然、GPUによる並列・高速化の恩恵が得られるため、普通にJavaScriptで計算を実装するよりも高速になることが期待できる、という算段である。

### 参考
Tensorflow.jsではどうやってWebGLを利用しているのか？
→ https://tfujiwar.hatenablog.com/entry/2018/05/21/120815
WebGLの基本
→ https://webglfundamentals.org/webgl/lessons/ja/webgl-fundamentals.html


