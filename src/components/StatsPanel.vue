<script setup>
/**
 * StatsPanel.vue —— 右侧统计：核查进度汇总 + 地类构成饼图（ECharts）
 */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  parcels: Array,     // 当前范围的图斑 Feature 数组
  project: Object     // 当前选中项目（null = 全县）
})

/* ---------- 核查状态汇总 ---------- */
const summary = ref({ total: 0, mu: 0, ok: 0, doubt: 0, bad: 0 })
const recount = () => {
  const fs = props.parcels || []
  const s = { total: fs.length, mu: 0, ok: 0, doubt: 0, bad: 0 }
  fs.forEach(f => {
    const p = f.properties
    s.mu += p.areaMu
    if (p.verifyStatus === '已核实') s.ok++
    else if (p.verifyStatus === '存疑') s.doubt++
    else s.bad++
  })
  summary.value = s
  renderPie(fs)
}

/* ---------- ECharts 饼图：地类构成 ---------- */
const chartEl = ref(null)
let chart
const renderPie = (fs) => {
  if (!chart) return
  const byType = {}
  fs.forEach(f => { const t = f.properties.landType; byType[t] = (byType[t] || 0) + 1 })
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#8298ba', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '44%'],
      label: { color: '#c6d4ea', fontSize: 11 },
      data: Object.entries(byType).map(([name, value]) => ({ name, value })),
      itemStyle: { borderColor: '#12203a', borderWidth: 2 }
    }]
  })
}

onMounted(() => {
  chart = echarts.init(chartEl.value)
  recount()
})
onBeforeUnmount(() => chart?.dispose())
watch(() => props.parcels, recount, { deep: true })
</script>

<template>
  <div class="panel">
    <div class="panel-title">{{ project ? '项目区核查进度' : '全县核查进度' }}</div>
    <div class="panel-body">
      <div class="stat-item"><span class="k">图斑总数</span><span class="v">{{ summary.total }} 个</span></div>
      <div class="stat-item"><span class="k">图斑面积</span><span class="v">{{ summary.mu.toLocaleString() }} 亩</span></div>
      <div class="stat-item"><span class="k">已核实</span><span class="v" style="color:#2ecc71">{{ summary.ok }}</span></div>
      <div class="stat-item"><span class="k">存疑</span><span class="v" style="color:#f1c40f">{{ summary.doubt }}</span></div>
      <div class="stat-item"><span class="k">图数不符</span><span class="v" style="color:#e74c3c">{{ summary.bad }}</span></div>
      <!-- 核查完成率进度条 -->
      <el-progress
        :percentage="summary.total ? Math.round(summary.ok / summary.total * 100) : 0"
        :stroke-width="10" style="margin-top:8px;"
      />
    </div>
  </div>

  <div class="panel">
    <div class="panel-title">地类构成</div>
    <div class="panel-body">
      <div ref="chartEl" style="width:100%;height:220px;"></div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-title">对接说明</div>
    <div class="panel-body" style="font-size:12px;color:#8298ba;line-height:1.8;">
      本系统为演示版，数据均为虚构。<br/>
      实际交付版本支持：图斑属性批量导入、质检比对、成果汇交至全国农田建设综合监测监管平台。
    </div>
  </div>
</template>
