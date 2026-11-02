/**
 * 演示数据：虚构的县域高标准农田项目区与地块图斑
 * ⚠️ 全部为虚构/示意数据，不使用任何真实图斑，可放心对外演示
 * 坐标范围参考南宁某县（约 E108.3, N22.8）
 */

// 中心点：地图初始视野
export const MAP_CENTER = [108.32, 22.82]
export const MAP_ZOOM = 12

// 三个高标准农田建设项目区（示意范围，用包围盒近似）
export const PROJECTS = [
  {
    id: 'P2023-01',
    name: '某县 2023 年高标准农田建设项目（示范区）',
    year: 2023,
    areaMu: 12000,          // 建设面积（亩）
    status: '已验收',
    // [minX, minY, maxX, maxY]
    extent: [108.26, 22.78, 108.34, 22.86]
  },
  {
    id: 'P2024-02',
    name: '某县 2024 年高标准农田建设项目（改造提升）',
    year: 2024,
    areaMu: 8500,
    status: '整改中',
    extent: [108.33, 22.80, 108.42, 22.87]
  },
  {
    id: 'P2025-03',
    name: '某县 2025 年高标准农田建设项目（新建）',
    year: 2025,
    areaMu: 15000,
    status: '上图入库',
    extent: [108.27, 22.86, 108.37, 22.93]
  }
]

/**
 * 地块图斑（虚构 GeoJSON，多边形手工构造）
 * verifyStatus: 已核实 / 存疑 / 图数不符 —— 模拟底数核查的三种成果状态
 */
const polygon = (cx, cy, w, h) => {
  // 以中心点生成一个带扰动感的四边形（手工坐标，避免依赖库）
  const dx = w / 2, dy = h / 2
  return [[
    [cx - dx, cy - dy + dy * 0.15],
    [cx + dx * 0.9, cy - dy],
    [cx + dx, cy + dy * 0.8],
    [cx - dx * 0.85, cy + dy],
    [cx - dx, cy - dy + dy * 0.15]
  ]]
}

const mk = (id, projId, cx, cy, w, h, mu, type, status) => ({
  type: 'Feature',
  properties: {
    id, projectId: projId,
    areaMu: mu,               // 图斑面积（亩）
    landType: type,           // 地类：水田 / 旱地 / 水浇地
    verifyStatus: status      // 核查状态
  },
  geometry: { type: 'Polygon', coordinates: polygon(cx, cy, w, h) }
})

export const PARCELS = {
  type: 'FeatureCollection',
  features: [
    // 项目 2023（示范区）——基本已核实
    mk('T001', 'P2023-01', 108.29, 22.81, 0.02, 0.018, 320, '水田', '已核实'),
    mk('T002', 'P2023-01', 108.32, 22.83, 0.022, 0.02, 410, '水田', '已核实'),
    mk('T003', 'P2023-01', 108.30, 22.84, 0.018, 0.016, 265, '旱地', '已核实'),
    mk('T004', 'P2023-01', 108.33, 22.80, 0.02, 0.017, 300, '旱地', '存疑'),
    // 项目 2024（改造提升）——问题较多
    mk('T005', 'P2024-02', 108.36, 22.82, 0.02, 0.018, 350, '水浇地', '图数不符'),
    mk('T006', 'P2024-02', 108.39, 22.84, 0.024, 0.02, 480, '水田', '已核实'),
    mk('T007', 'P2024-02', 108.37, 22.85, 0.018, 0.015, 220, '旱地', '存疑'),
    mk('T008', 'P2024-02', 108.40, 22.81, 0.02, 0.017, 310, '旱地', '图数不符'),
    // 项目 2025（新建）——入库阶段
    mk('T009', 'P2025-03', 108.30, 22.89, 0.022, 0.018, 390, '水田', '已核实'),
    mk('T010', 'P2025-03', 108.33, 22.90, 0.02, 0.02, 430, '水田', '已核实'),
    mk('T011', 'P2025-03', 108.35, 22.91, 0.018, 0.016, 250, '旱地', '存疑'),
    mk('T012', 'P2025-03', 108.31, 22.92, 0.019, 0.015, 280, '水浇地', '已核实')
  ]
}

// 核查状态 → 颜色（红 = 问题、黄 = 存疑、绿 = 通过，符合政企大屏习惯）
export const STATUS_COLOR = {
  '已核实': '#2ecc71',
  '存疑': '#f1c40f',
  '图数不符': '#e74c3c'
}

/**
 * 农田设施要素层（虚构）—— 真实一张图中需单独上图的要素：
 * 灌排渠（线）、机耕路（线）、蓄水池/泵站（点）
 */
const line = (coords, name, ftype, projId, lengthM) => ({
  type: 'Feature',
  properties: { name, facilityType: ftype, projectId: projId, lengthM },
  geometry: { type: 'LineString', coordinates: coords }
})
const point = (coord, name, ftype, projId) => ({
  type: 'Feature',
  properties: { name, facilityType: ftype, projectId: projId },
  geometry: { type: 'Point', coordinates: coord }
})

export const FACILITIES = {
  // 灌排渠道（线要素）
  canals: {
    type: 'FeatureCollection',
    features: [
      line([[108.28, 22.79], [108.30, 22.81], [108.31, 22.83]], '1# 灌溉干渠', '灌排渠', 'P2023-01', 1850),
      line([[108.31, 22.79], [108.33, 22.81]], '2# 排水渠', '灌排渠', 'P2023-01', 920),
      line([[108.35, 22.81], [108.37, 22.83], [108.39, 22.83]], '3# 灌溉干渠', '灌排渠', 'P2024-02', 2100),
      line([[108.29, 22.88], [108.31, 22.90], [108.33, 22.90]], '4# 灌溉干渠', '灌排渠', 'P2025-03', 1650)
    ]
  },
  // 机耕路（线要素）
  roads: {
    type: 'FeatureCollection',
    features: [
      line([[108.28, 22.82], [108.32, 22.84], [108.34, 22.85]], '示范区 1# 机耕路', '机耕路', 'P2023-01', 2300),
      line([[108.36, 22.84], [108.40, 22.86]], '提升区 1# 机耕路', '机耕路', 'P2024-02', 1400),
      line([[108.30, 22.91], [108.34, 22.92]], '新建区 1# 机耕路', '机耕路', 'P2025-03', 1750)
    ]
  },
  // 蓄水/提水设施（点要素）
  ponds: {
    type: 'FeatureCollection',
    features: [
      point([108.295, 22.800], '1# 蓄水池', '蓄水池', 'P2023-01'),
      point([108.315, 22.825], '1# 泵站', '泵站', 'P2023-01'),
      point([108.375, 22.825], '2# 蓄水池', '蓄水池', 'P2024-02'),
      point([108.395, 22.845], '2# 泵站', '泵站', 'P2024-02'),
      point([108.305, 22.895], '3# 蓄水池', '蓄水池', 'P2025-03'),
      point([108.335, 22.905], '3# 泵站', '泵站', 'P2025-03')
    ]
  }
}

// 设施类型 → 样式
export const FACILITY_STYLE = {
  '灌排渠': { color: '#3aa0ff', width: 3 },
  '机耕路': { color: '#b58cff', width: 3 }
}
export const POND_COLOR = { '蓄水池': '#36cfc9', '泵站': '#ff9c6e' }

/**
 * 举证照片占位图（SVG data URI，虚构）——
 * 真实项目中外业 App 拍照后按图斑 ID 挂接，此处用占位图模拟
 */
export const photoPlaceholder = (label, hue) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160">
    <rect width="240" height="160" fill="hsl(${hue},32%,26%)"/>
    <path d="M0 120 L70 70 L130 110 L180 60 L240 100 L240 160 L0 160 Z" fill="hsl(${hue},30%,34%)"/>
    <circle cx="195" cy="35" r="18" fill="hsl(${hue},40%,60%)"/>
    <text x="12" y="28" font-size="16" fill="#d7e3f4" font-family="sans-serif">${label}</text>
    <text x="12" y="148" font-size="11" fill="#9fb4d4" font-family="sans-serif">模拟举证照片（虚构）</text>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// 按图斑 ID 生成固定的 3 张占位照片
export const parcelPhotos = (parcelId) => {
  const seed = parcelId.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return [0, 1, 2].map(i => photoPlaceholder(`${parcelId} 举证 ${i + 1}`, (seed * 37 + i * 60) % 360))
}
