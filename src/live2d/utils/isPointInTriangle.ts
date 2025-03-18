/**
 * レイキャスティングアルゴリズムで点が三角形内にあるか判定する（2D）
 * 1. 判定したい点から任意の方向（通常はX軸の正方向）に無限の半直線（レイ）を伸ばす
 * 2. このレイとポリゴンの辺との交点の数をカウントする
 * 3. 交点の数が奇数なら点はポリゴン内、偶数なら点はポリゴン外にある
 *
 * @param p 点
 * @param a 三角形頂点1
 * @param b 三角形頂点2
 * @param c 三角形頂点3
 */
export function isPointInTriangle(p: number[], a: number[], b: number[], c: number[]): boolean {
  // 点の座標
  const x = p[0]
  const y = p[1]
  const vertices = [a, b, c]
  const vertexCount = vertices.length

  let isInside = false

  // ポリゴンの各辺について判定
  for (let i = 0, j = vertexCount - 1; i < vertexCount; j = i++) {
    const xi = vertices[i][0]
    const yi = vertices[i][1]
    const xj = vertices[j][0]
    const yj = vertices[j][1]

    // 点のy座標が辺の両端のy座標の間にある、かつ
    // 点から右方向に伸ばした半直線が辺と交差する場合
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      isInside = !isInside
    }
  }
  return isInside
}
