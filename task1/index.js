/* eslint no-console:0 consistent-return:0 */
"use strict";

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
  gl.clear(gl.COLOR_BUFFER_BIT);
}
// ポリゴンの頂点情報を格納する
function setVertex(gl){
  // 実際に、a_positionに与えるデータを定義する
  // ★★★★課題2★★★★
  // 星形を表現するために必要な座標を定義して与えてください。
  var positions = [
    0, 0,
    0, 0.5,
    0.7, 0.5,
    0.7, 0,
  ];
  // ★★★★★★★★★★★★
  // 「ARRAY_BUFFER」が指す領域に、頂点情報を格納する
  //   第一引数: ARRAY_BUFFERの指定
  //   第二引数: 与えるデータを指定。この時、厳密な型が必要なため、キャストを行なっている
  //   第三引数: データの更新頻度を指定している。STATIC_DRAWは更新頻度低
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}
function main() {
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
  // 頂点シェーダに与える引数(a_position)を特定し、WebGLに認識させる
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  // position用のbuffer領域をWebGL固有の「ARRAY_BUFFER」フィールドに紐づける
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // positionの定義とバッファへの格納を行う
  setVertex(gl)

  // ===== レンダリング処理 =====
  // ---- キャンバスの設定 ----
  initCanvas(gl);
  // 使うプログラムを指定
  gl.useProgram(program);

  // attribute属性の引数(=a_position)の入力を有効化する
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // positionsデータをどのようにARRAY_BUFFERに搭載するかを定義する。
  // 頂点シェーダでは、vec4(4次元のベクトル)を入力とするので、想定するデータフォーマットになるように整形する
  var size = 2;          // positionsから2要素ずつ切り取る
  var type = gl.FLOAT;   // 32bit float型
  var normalize = false; // 正規化行わない
  var stride = 0;        // 次のデータの切り出しを行う際の移動幅
  var offset = 0;        // 最初の切り出しを行う際に読み飛ばす幅
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // draw
  var primitiveType = gl.TRIANGLE_FAN; // 頂点4つを使って、三角形を2つ描画する
  var offset = 0;
  var count = 4; // 頂点4つ使って描画することを表す
  gl.drawArrays(primitiveType, offset, count);
}

main();
