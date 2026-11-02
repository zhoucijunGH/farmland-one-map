/**
 * 业务接口：项目区 + 地块图斑
 *
 * mock 分支（现在）：返回本地虚构数据，模拟 300ms 网络延迟
 * 真实分支（交付时）：把 USE_MOCK 改为 false，接口路径即真实后端路径
 *   - fetchProjects() → GET /farmland/projects
 *   - fetchParcels()  → GET /farmland/parcels  （GeoJSON FeatureCollection）
 * 若依后端只需提供这两个 REST 接口，数据库无关（MySQL/达梦均可）
 */
import { USE_MOCK, request } from './index.js'
import { PROJECTS, PARCELS } from '../data/parcels.js'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function fetchProjects() {
  if (USE_MOCK) { await delay(300); return PROJECTS }
  return request('/farmland/projects')
}

export async function fetchParcels() {
  if (USE_MOCK) { await delay(300); return PARCELS }
  return request('/farmland/parcels') // 返回 GeoJSON FeatureCollection
}
