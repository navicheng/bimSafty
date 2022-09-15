import request from '@/utils/request'

// 查询风险列表
export function listBimRisk(query) {
  return request({
    url: '/system/bimRisk/list',
    method: 'get',
    params: query
  })
}

// 查询风险详细
export function getBimRisk(id) {
  return request({
    url: '/system/bimRisk/' + id,
    method: 'get'
  })
}

// 新增风险
export function addBimRisk(data) {
  return request({
    url: '/system/bimRisk',
    method: 'post',
    data: data
  })
}

// 修改风险
export function updateBimRisk(data) {
  return request({
    url: '/system/bimRisk',
    method: 'put',
    data: data
  })
}

// 删除风险
export function delBimRisk(id) {
  return request({
    url: '/system/bimRisk/' + id,
    method: 'delete'
  })
}
