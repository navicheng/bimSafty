import request from '@/utils/request'

// 查询bim风险列表
export function listRisk(query) {
  return request({
    url: '/system/risk/list',
    method: 'get',
    params: query
  })
}

// 查询bim风险详细
export function getRisk(id) {
  return request({
    url: '/system/risk/' + id,
    method: 'get'
  })
}

// 新增bim风险
export function addRisk(data) {
  return request({
    url: '/system/risk',
    method: 'post',
    data: data
  })
}

// 修改bim风险
export function updateRisk(data) {
  return request({
    url: '/system/risk',
    method: 'put',
    data: data
  })
}

// 删除bim风险
export function delRisk(id) {
  return request({
    url: '/system/risk/' + id,
    method: 'delete'
  })
}
