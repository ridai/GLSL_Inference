/* eslint no-console:0 consistent-return:0 */
"use strict";

var RESOLUTION = 512;
const TEXTURE_WIDTH = 100;
const TEXTURE_HEIGHT = 100;

// シェーダをGPUにUploadしてコンパイルまで行う
function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  // sourceで受け取ったシェーダ文字列をUpload
  gl.shaderSource(shader, source);
  // シェーダをCompile
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  // 失敗したら後処理してエラー出力
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}
// 頂点シェーダとフラグメントシェーダをプログラムという単位にまとめてlinkさせる
function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  // プログラムに頂点シェーダを与える
  gl.attachShader(program, vertexShader);
  // プログラムにフラグメントシェーダを与える
  gl.attachShader(program, fragmentShader);
  // WebGLにプログラムをlinkさせる
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  // 失敗したら後処理してエラー出力
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}
// キャンバス描画の初期化
function initCanvas(gl){
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  // WebGL上で、クリップ空間(-1~1で表現される座標)をキャンバス座標に変換するために必要な情報を渡す
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // キャンバスの色を無色に初期化する
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
// ポリゴンの頂点情報を格納する
function setVertex(gl){
  // 実際に、a_positionに与えるデータを定義する
  var positions = [
    -1.0, -1.0,
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, -1.0,
    1.0, 1.0,
    1.0, -1.0,
  ];
  // 「ARRAY_BUFFER」が指す領域に、頂点情報を格納する
  //   第一引数: ARRAY_BUFFERの指定
  //   第二引数: 与えるデータを指定。この時、厳密な型が必要なため、キャストを行なっている
  //   第三引数: データの更新頻度を指定している。STATIC_DRAWは更新頻度低
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}
// ポリゴンに対応するテクスチャマップの座標情報を定義
function setTexcoords(gl) {
  var texcoords = [
    0.0, 0.0,
    0.0, 1.0,
    1.0, 1.0,
    0.0, 0.0,
    1.0, 1.0,
    1.0, 0.0,
  ];
  // 「ARRAY_BUFFER」が指す領域に、頂点情報を格納する
  //   第一引数: ARRAY_BUFFERの指定
  //   第二引数: 与えるデータを指定。この時、厳密な型が必要なため、キャストを行なっている
  //   第三引数: データの更新頻度を指定している。STATIC_DRAWは更新頻度低
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
}
function computeKernelWeight(kernel) {
  var weight = kernel.reduce(function(prev, curr) {
      return prev + curr;
  });
  return weight <= 0 ? 1 : weight;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
function main() {
  function drawScene(){
    // ===== レンダリング処理 =====
    // ---- キャンバスの設定 ----
    initCanvas(gl);

    // 使うプログラムを指定
    gl.useProgram(program);

    // attribute属性の引数(=a_position)の入力を有効化する
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // a_positionにが指すデータをどのように入力値として解釈するか(=vec4のデータと見るか)定義を行う。
    // 頂点シェーダでは、vec4(4次元のベクトル)を入力とするので、想定するデータフォーマットになるように整形する
    var size = 2;          // positionsから2要素ずつ切り取る
    var type = gl.FLOAT;   // 32bit float型
    var normalize = false; // 正規化行わない
    var stride = 0;        // 次のデータの切り出しを行う際の移動幅
    var offset = 0;        // 最初の切り出しを行う際に読み飛ばす幅
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    // attribute属性の引数(=a_textcoords)の入力を有効化する
    gl.enableVertexAttribArray(texcoordAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    // a_texcoordsにが指すデータをどのように入力値として解釈するか(=vec4のデータと見るか)定義を行う。
    // 頂点シェーダでは、vec4(4次元のベクトル)を入力とするので、想定するデータフォーマットになるように整形する
    var size = 2;          // texcoordsから2要素ずつ切り取る
    var type = gl.FLOAT;   // 32bit float型
    var normalize = false; // 正規化行わない
    var stride = 0;        // 次のデータの切り出しを行う際の移動幅
    var offset = 0;        // 最初の切り出しを行う際に読み飛ばす幅
    gl.vertexAttribPointer(
        texcoordAttributeLocation, size, type, normalize, stride, offset);

    // uniformを与える
    gl.uniform2fv(resolutionUniformLocation, [RESOLUTION, RESOLUTION]);
    // ****課題5****
    // 任意の畳み込み行列を宣言して、フラグメントシェーダに引数として渡そう
    // *************

    // draw
    var primitiveType = gl.TRIANGLES; // 頂点6つを使って、三角形を2つ描画する
    var offset = 0;
    var count = 6; // 頂点6つ使って描画することを表す
    gl.drawArrays(primitiveType, offset, count);
  }

  // ===== 初期化処理 =====
  // canvasタグを指定して取得
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // ----- シェーダの定義 ----
  // 頂点シェーダの定義を文字列として取得
  var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
  // フラグメントシェーダの定義を文字列として取得
  var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
  // createShaderメソッドをcallしてコンパイルまで行う
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  // シェーダをプログラムにまとめ、WebGLにリンクさせる
  var program = createProgram(gl, vertexShader, fragmentShader);

  // ----- シェーダに渡す引数の定義 ----
  // 頂点シェーダに与える引数(a_position/a_texcoords)を特定し、WebGLに認識させる
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoords");
  // フラグメントシェーダに与える引数(r=解像度/texture情報/畳み込み行列/畳み込み重み)を特定し、WebGLに認識させる
  var resolutionUniformLocation = gl.getUniformLocation(program, 'r');
  var textureUniformLocation = gl.getUniformLocation(program, "u_texture");
  var kernelUniformLocation = gl.getUniformLocation(program, "u_kernel[0]");
  var kernelWeightUniformLocation = gl.getUniformLocation(program, "u_kernelWeight");
  var textureSizeUniformLocation = gl.getUniformLocation(program, "u_textureSize");

  // ---- positions設定 ----
  // position用のbuffer領域をWebGL固有の「ARRAY_BUFFER」フィールドに紐づける
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // positionの定義とバッファへの格納を行う
  setVertex(gl)

  // ---- texturecoords設定 ----
  // texture座標用のbuffer領域をWebGL固有の「ARRAY_BUFFER」フィールドに紐づける
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // テクスチャ座標情報の定義とバッファへの格納を行う
  setTexcoords(gl)

  // ---- texture設定 ----
  // texture情報そのものを格納する領域をWebGL固有の「TEXTURE_2D」フィールドに紐づける
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // ****課題5****
  // テクスチャを利用して、100x100行列データを適当に作ってフラグメントシェーダに渡す

  // もしtextureのサイズが4の倍数でない値にしたい場合は、以下設定を使うこと
  // const alignment = 1;
  // gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
  // *************


  drawScene();
}


main();
