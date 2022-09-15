import request from '@/utils/request'

// 查询bim模型列表
export function listBimModel(query) {
  return request({
    url: '/system/bimModel/list',
    method: 'get',
    params: query
  })
}

// 查询bim模型详细
export function getBimModel(id) {
  return request({
    url: '/system/bimModel/' + id,
    method: 'get'
  })
}

// 新增bim模型
export function addBimModel(data) {
  return request({
    url: '/system/bimModel',
    method: 'post',
    data: data
  })
}

// 修改bim模型
export function updateBimModel(data) {
  return request({
    url: '/system/bimModel',
    method: 'put',
    data: data
  })
}

// 删除bim模型
export function delBimModel(id) {
  return request({
    url: '/system/bimModel/' + id,
    method: 'delete'
  })
}
