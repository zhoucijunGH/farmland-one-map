<script setup>
/**
 * App.vue —— 整体布局：左（图层/项目列表） + 中（地图） + 右（统计）
 */
import { ref, computed, onMounted } from 'vue'
import { fetchProjects, fetchParcels } from './api/parcels.js'
import { parcelPhotos } from './data/parcels.js'
import MapView from './components/MapView.vue'
import StatsPanel from './components/StatsPanel.vue'

/* ---------- 数据加载（走 API 层，mock/真实后端均可） ---------- */
const projects = ref([])     // 项目区列表
const parcels = ref(null)    // 图斑 GeoJSON FeatureCollection
const loading = ref(true)
onMounted(async () => {
  const [p, f] = await Promise.all([fetchProjects(), fetchParcels()])
  projects.value = p
  parcels.value = f
  loading.value = false
})

/* ---------- 图层开关 ---------- */
// 注意：el-switch 用 v-model 已自动翻转值，不要再在 @change 里手动取反（否则双重翻转失效）
const layers = ref({
  parcels: true,      // 图斑层
  projects: true,     // 项目区范围层
  labels: true,       // 标注层
  facilities: true    // 农田设施层（渠/路/塘）
})

/* ---------- 项目定位 ---------- */
const mapRef = ref(null)              // MapView 组件实例
const activeProject = ref(null)       // 当前选中项目
const locateProject = (proj) => {
  activeProject.value = proj
  mapRef.value?.flyToExtent(proj.extent)
}

/* ---------- 图斑选中联动 ---------- */
const selectedParcel = ref(null)
const onParcelSelect = (props) => { selectedParcel.value = props }

/* ---------- 统计数据（按选中项目过滤，未选 = 全县） ---------- */
const scopeParcels = computed(() => {
  const all = parcels.value?.features || []
  if (!activeProject.value) return all
  return all.filter(f => f.properties.projectId === activeProject.value.id)
})
</script>

<template>
  <div class="layout">
    <!-- 顶栏 -->
    <div class="header">
      <span class="title">县域高标准农田一张图</span>
      <span class="sub">上图入库 · 底数核查 · 演示数据（虚构）</span>
    </div>

    <div class="main">
      <!-- 左：图层 + 项目列表 -->
      <div class="left">
        <div class="panel">
          <div class="panel-title">图层管理</div>
          <div class="panel-body">
            <div class="layer-row" v-for="(name, key) in { parcels: '地块图斑', projects: '项目区范围', labels: '图斑标注', facilities: '农田设施（渠/路/塘）' }" :key="key">
              <span class="name">{{ name }}</span>
              <el-switch v-model="layers[key]" size="small" />
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">项目区列表</div>
          <div class="panel-body">
            <div
              v-for="p in projects" :key="p.id"
              style="padding:8px;border-radius:6px;cursor:pointer;margin-bottom:6px; border:1px solid transparent;"
              :style="activeProject?.id === p.id ? { background: '#1a3358', borderColor: '#2c5a9e' } : {}"
              @click="locateProject(p)"
            >
              <div style="font-size:13px;color:#c6d4ea;">{{ p.name }}</div>
              <div style="font-size:12px;color:#8298ba;margin-top:3px;">
                {{ p.areaMu }} 亩
                <el-tag size="small" style="margin-left:6px;" :type="p.status === '已验收' ? 'success' : (p.status === '整改中' ? 'danger' : 'warning')">{{ p.status }}</el-tag>
              </div>
            </div>
            <el-button v-if="activeProject" size="small" link @click="activeProject = null; mapRef?.resetView()">返回全县视图</el-button>
          </div>
        </div>
      </div>

      <!-- 中：地图 -->
      <div class="center">
        <MapView
          v-if="!loading"
          ref="mapRef"
          :layers="layers"
          :active-project="activeProject"
          :projects="projects"
          :parcels="parcels"
          @parcel-select="onParcelSelect"
        />
        <!-- 图斑详情 + 模拟举证照片 -->
        <div class="map-tip parcel-card" v-if="selectedParcel">
          <div style="margin-bottom:4px;">
            图斑 <b style="color:#7fd8c8">{{ selectedParcel.id }}</b>
            ｜{{ selectedParcel.landType }}｜{{ selectedParcel.areaMu }} 亩
            ｜<span :style="{ color: { 已核实: '#2ecc71', 存疑: '#f1c40f', 图数不符: '#e74c3c' }[selectedParcel.verifyStatus] }">{{ selectedParcel.verifyStatus }}</span>
          </div>
          <div style="font-size:11px;color:#8fc7ff;margin:4px 0;">外业举证照片</div>
          <div style="display:flex;gap:6px;">
            <img v-for="(src, i) in parcelPhotos(selectedParcel.id)" :key="i" :src="src"
                 style="width:78px;height:52px;border-radius:4px;border:1px solid #1d3557;object-fit:cover;" />
          </div>
        </div>
        <div class="legend">
          <div style="color:#8fc7ff;margin-bottom:4px;">核查状态</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#2ecc71"/>已核实</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#f1c40f"/>存疑</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#e74c3c"/>图数不符</div>
          <div style="color:#8fc7ff;margin:6px 0 4px;">农田设施</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#3aa0ff;height:4px;"/>灌排渠</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#b58cff;height:4px;"/>机耕路</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#36cfc9;border-radius:50%;"/>蓄水池</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#ff9c6e;border-radius:50%;"/>泵站</div>
        </div>
      </div>

      <!-- 右：统计 -->
      <div class="right">
        <StatsPanel :parcels="scopeParcels" :project="activeProject" />
      </div>
    </div>
  </div>
</template>
