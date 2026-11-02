/**
 * 底图源配置 —— 切换底图只改这里
 *
 * 三种来源说明：
 * 1. gaode   ：高德矢量瓦片，仅用于公开演示
 * 2. tianditu：天地图官方 XYZ 服务（合规、公开项目标配），需要免费注册 key
 *              注册地址：https://console.tianditu.gov.cn/api/key  （选"浏览器端"类型）
 *              拿到 key 后把下面的 KEY 换掉即可，矢量和注记两层都要用同一个 key
 * 3. internal：自然资源/ArcGIS Server 内部服务，部署到甲方内网时填内网地址
 *              缓存切片示例：http://内网IP:6080/arcgis/rest/services/底图/MapServer/tile/{z}/{y}/{x}
 */
const TIANDITU_KEY = '你的天地图key' // ← 替换成自己注册的 key

export const BASE_MAPS = {
  gaode: {
    label: '高德（演示）',
    layers: [
      {
        url: 'https://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
      }
    ]
  },
  tianditu: {
    label: '天地图',
    layers: [
      // 矢量底图
      { url: `https://t{0-7}.tianditu.gov.cn/vec_w/wmts?layer=vec&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&tk=${TIANDITU_KEY}&TileMatrix={z}&TileCol={x}&TileRow={y}` },
      // 中文注记层
      { url: `https://t{0-7}.tianditu.gov.cn/cia_w/wmts?layer=cia&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&tk=${TIANDITU_KEY}&TileMatrix={z}&TileCol={x}&TileRow={y}` }
    ]
  },
  internal: {
    label: '内部服务（占位）',
    layers: [
      // 部署到甲方内网时替换成实际 ArcGIS Server / GeoServer 地址，例如：
      // { url: 'http://192.168.1.100:6080/arcgis/rest/services/BASE/MapServer/tile/{z}/{y}/{x}' }
      { url: '' }
    ]
  }
}
