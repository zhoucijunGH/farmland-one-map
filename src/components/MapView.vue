<script setup>
/**
 * MapView.vue —— OpenLayers 地图核心
 * 功能：高德底图 + 图斑 GeoJSON 渲染 + 项目区范围 + 点击选中 + 飞行定位
 */
import { ref, onMounted, watch } from 'vue'
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import XYZ from 'ol/source/XYZ.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import Style from 'ol/style/Style.js'
import Stroke from 'ol/style/Stroke.js'
import Fill from 'ol/style/Fill.js'
import Text from 'ol/style/Text.js'
import CircleStyle from 'ol/style/Circle.js'
import { fromLonLat, transformExtent } from 'ol/proj.js'
import { BASE_MAPS } from '../data/baseMaps.js'
import { STATUS_COLOR, MAP_CENTER, MAP_ZOOM, FACILITIES, FACILITY_STYLE, POND_COLOR } from '../data/parcels.js'

const props = defineProps({
  layers: Object,          // 图层开关 { parcels, projects, labels }
  activeProject: Object,   // 当前选中项目（高亮其图斑）
  projects: Array,         // 项目区列表（由父组件通过 API 层加载）
  parcels: Object          // 图斑 GeoJSON FeatureCollection
})
const emit = defineEmits(['parcel-select'])

const mapEl = ref(null)
const baseMapKey = ref('gaode')       // 当前底图（高德/天地图/内部）
let map, parcelLayer, projectLayer, baseLayers = []
let facilityLayer, pondLayer   // 农田设施层：渠/路（线）+ 蓄水池/泵站（点）

/* ---------- 图斑样式：按核查状态着色 ---------- */
const parcelStyle = (feature) => {
  const status = feature.get('verifyStatus')
  const active = props.activeProject && feature.get('projectId') === props.activeProject.id
  return new Style({
    stroke: new Stroke({ color: active ? '#4dd0ff' : '#0b1220', width: active ? 2.5 : 1.5 }),
    fill: new Fill({ color: STATUS_COLOR[status] + (active ? 'b0' : '70') }),
    text: props.layers.labels ? new Text({
      text: feature.get('id'),
      font: '11px sans-serif',
      fill: new Fill({ color: '#d7e3f4' }),
      stroke: new Stroke({ color: '#0b1220', width: 3 })
    }) : undefined
  })
}

/* ---------- 项目区范围样式 ---------- */
const projectStyle = (feature) => new Style({
  stroke: new Stroke({ color: '#4dd0ff', width: 2, lineDash: [6, 4] }),
  fill: new Fill({ color: 'rgba(77, 208, 255, 0.06)' })
})

/* ---------- 农田设施样式：线按类型着色，点用圆形符号 ---------- */
const facilityLineStyle = (feature) => {
  const s = FACILITY_STYLE[feature.get('facilityType')] || { color: '#3aa0ff', width: 2 }
  return new Style({ stroke: new Stroke({ color: s.color, width: s.width }) })
}
const facilityPointStyle = (feature) => new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: POND_COLOR[feature.get('facilityType')] || '#36cfc9' }),
    stroke: new Stroke({ color: '#0b1220', width: 2 })
  }),
  text: new Text({
    text: feature.get('name'),
    font: '11px sans-serif',
    offsetY: -16,
    fill: new Fill({ color: '#d7e3f4' }),
    stroke: new Stroke({ color: '#0b1220', width: 3 })
  })
})

onMounted(() => {
  // 底图：由 BASE_MAPS 配置驱动，可切换高德/天地图/内部 ArcGIS 服务
  buildBaseLayers(baseMapKey.value)

  parcelLayer = new VectorLayer({
    source: new VectorSource({ features: new GeoJSON().readFeatures(props.parcels, { featureProjection: 'EPSG:3857' }) }),
    style: parcelStyle
  })
  projectLayer = new VectorLayer({
    source: new VectorSource({
      features: props.projects.map(p => new GeoJSON().readFeature(
        { type: 'Feature', properties: { id: p.id }, geometry: { type: 'Polygon', coordinates: [[
          [p.extent[0], p.extent[1]], [p.extent[2], p.extent[1]],
          [p.extent[2], p.extent[3]], [p.extent[0], p.extent[3]],
          [p.extent[0], p.extent[1]]
        ]] } },
        { featureProjection: 'EPSG:3857' }
      ))
    }),
    style: projectStyle,
    zIndex: 5
  })

  // 设施层：渠/路（线）+ 蓄水池/泵站（点）合并到一个图层
  const facilitySource = new VectorSource()
  ;[FACILITIES.canals, FACILITIES.roads].forEach(fc =>
    facilitySource.addFeatures(new GeoJSON().readFeatures(fc, { featureProjection: 'EPSG:3857' }))
  )
  const pondSource = new VectorSource({
    features: new GeoJSON().readFeatures(FACILITIES.ponds, { featureProjection: 'EPSG:3857' })
  })
  facilityLayer = new VectorLayer({
    source: facilitySource,
    style: facilityLineStyle,
    zIndex: 8
  })
  const pondLayerTmp = new VectorLayer({ source: pondSource, style: facilityPointStyle, zIndex: 9 })
  pondLayer = pondLayerTmp

  map = new Map({
    target: mapEl.value,
    layers: [...baseLayers, parcelLayer, projectLayer, facilityLayer, pondLayerTmp],
    view: new View({ center: fromLonLat(MAP_CENTER), zoom: MAP_ZOOM })
  })

  // 点击图斑 → 抛给父组件展示属性
  map.on('click', (e) => {
    const hit = map.getFeaturesAtPixel(e.pixel, { layerFilter: l => l === parcelLayer })[0]
    emit('parcel-select', hit ? hit.getProperties() : null)
  })
})

/* ---------- 底图构建与切换 ---------- */
const buildBaseLayers = (key) => {
  baseLayers.forEach(l => map?.removeLayer(l))
  baseLayers = (BASE_MAPS[key]?.layers || [])
    .filter(l => l.url)
    .map(l => new TileLayer({ source: new XYZ({ url: l.url }) }))
  baseLayers.forEach((l, i) => l.setZIndex(i)) // 保证底图在最底层
  baseLayers.forEach(l => map?.getLayers().insertAt(0, l))
}
const switchBaseMap = (key) => {
  baseMapKey.value = key
  if (map) buildBaseLayers(key)
}

/* 图层开关与选中项目变化 → 重刷样式/可见性 */
watch(() => props.layers, () => {
  if (parcelLayer) { parcelLayer.setVisible(props.layers.parcels); parcelLayer.changed() }
  if (projectLayer) projectLayer.setVisible(props.layers.projects)
  if (facilityLayer) facilityLayer.setVisible(props.layers.facilities)
  if (pondLayer) pondLayer.setVisible(props.layers.facilities)
}, { deep: true })
watch(() => props.activeProject, () => parcelLayer?.changed())

/* 供父组件调用的定位方法 */
const flyToExtent = (extent) => {
  map.getView().fit(
    transformExtent(extent, 'EPSG:4326', 'EPSG:3857'),
    { size: map.getSize(), padding: [40, 40, 40, 40], duration: 600 }
  )
}
const resetView = () => map.getView().animate({ center: fromLonLat(MAP_CENTER), zoom: MAP_ZOOM, duration: 500 })
const refresh = () => parcelLayer?.changed()

defineExpose({ flyToExtent, resetView, refresh })
</script>

<template>
  <div style="position:relative;width:100%;height:100%;">
    <div ref="mapEl" style="width:100%;height:100%;"></div>
    <!-- 底图切换（右上角悬浮） -->
    <div class="base-switch">
      <el-radio-group v-model="baseMapKey" size="small" @change="switchBaseMap">
        <el-radio-button v-for="(bm, key) in BASE_MAPS" :key="key" :value="key">{{ bm.label }}</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>
