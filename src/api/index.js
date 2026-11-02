/**
 * 统一请求封装 —— 预留数据库/后端对接能力
 *
 * 设计说明（对接真实后端时只改这里，组件零改动）：
 * - 开发演示阶段：USE_MOCK = true，直接返回本地虚构数据
 * - 交付阶段：USE_MOCK = false，所有请求走 baseURL（如若依 RuoYi 后端 /api，
 *   数据库层无论是 MySQL 还是达梦、人大金仓，对前端透明）
 * - 认证预留：真实部署时若依后端要求请求头带 Authorization token，
 *   request() 里已预留注入位置
 */

export const USE_MOCK = true

// 后端地址：部署时用 Vite 环境变量注入（.env.production 里配 VITE_API_BASE）
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * 通用请求方法
 * @param {string} path 接口路径，如 '/farmland/projects'
 * @param {object} options fetch 选项
 */
export async function request(path, options = {}) {
  if (USE_MOCK) {
    throw new Error('USE_MOCK 模式下不应发起真实请求，请走 api/parcels.js 中的 mock 分支')
  }
  const res = await fetch(API_BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      // 预留：对接若依后端时在此注入 token
      // Authorization: 'Bearer ' + localStorage.getItem('token'),
      ...(options.headers || {})
    },
    ...options
  })
  if (!res.ok) throw new Error(`请求失败 ${res.status}: ${path}`)
  return res.json()
}
