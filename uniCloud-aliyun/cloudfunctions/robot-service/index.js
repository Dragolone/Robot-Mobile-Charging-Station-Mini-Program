// robot-service 云函数
// 提供 3 个接口：
// 1) robotList     - 返回 robots 列表，并拼上 telemetry_latest、faultCount
// 2) robotDetail   - 按 robotCode 返回 robot + telemetry_latest + 最近 faults(20)
// 3) commandCreate - 写入 commands，并做节流与入参校验

'use strict'

const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command
const $ = dbCmd.aggregate

function success(data) {
  return {
    code: 0,
    data
  }
}

function fail(code, message) {
  return {
    code,
    message
  }
}

async function getRobotByCode(robotCode) {
  const res = await db.collection('robots').where({ robotCode }).limit(1).get()
  if (!res.data || res.data.length === 0) {
    return null
  }
  return res.data[0]
}

async function getAuthUid(context, uniIdToken) {
  const token = String(uniIdToken || '').trim()
  if (!token) {
    return fail(30201, '未登录')
  }

  const uniIDIns = uniID.createInstance({ context })
  const checkTokenRes = await uniIDIns.checkToken(token)
  if (!checkTokenRes || checkTokenRes.errCode !== 0 || !checkTokenRes.uid) {
    return fail(checkTokenRes?.errCode || 30202, checkTokenRes?.message || '登录状态失效')
  }

  return success({ uid: checkTokenRes.uid })
}

async function handleRobotList() {
  // 获取所有机器人
  const robotsRes = await db.collection('robots').get()
  const robots = robotsRes.data || []

  if (robots.length === 0) {
    return success({ list: [] })
  }

  const robotCodes = robots.map(r => r.robotCode)

  // 获取最新遥测数据
  const telemetryRes = await db
    .collection('telemetry_latest')
    .where({
      robotCode: dbCmd.in(robotCodes)
    })
    .get()

  const telemetryMap = {}
  ;(telemetryRes.data || []).forEach(item => {
    telemetryMap[item.robotCode] = item
  })

  // 聚合每个机器人的故障数量
  const faultsAggRes = await db
    .collection('faults')
    .aggregate()
    .match({
      robotCode: dbCmd.in(robotCodes)
    })
    .group({
      _id: '$robotCode',
      count: $.sum(1)
    })
    .end()

  const faultCountMap = {}
  ;(faultsAggRes.data || []).forEach(item => {
    faultCountMap[item._id] = item.count
  })

  const list = robots.map(r => {
    return {
      robot: r,
      telemetry: telemetryMap[r.robotCode] || null,
      faultCount: faultCountMap[r.robotCode] || 0
    }
  })

  return success({ list })
}

async function handleRobotDetail(event) {
  const robotCode = (event && event.robotCode) || ''
  if (!robotCode) {
    return fail(1001, 'robotCode 不能为空')
  }

  const robot = await getRobotByCode(robotCode)
  if (!robot) {
    return fail(1002, 'robotCode 不存在')
  }

  // 最新遥测
  const telemetryRes = await db
    .collection('telemetry_latest')
    .where({ robotCode })
    .orderBy('ts', 'desc')
    .limit(1)
    .get()
  const telemetry =
    telemetryRes.data && telemetryRes.data.length > 0 ? telemetryRes.data[0] : null

  // 最近 20 条故障
  const faultsRes = await db
    .collection('faults')
    .where({ robotCode })
    .orderBy('ts', 'desc')
    .limit(20)
    .get()

  return success({
    robot,
    telemetry,
    faults: faultsRes.data || []
  })
}

async function handleCommandCreate(event) {
  const robotCode = (event && event.robotCode) || ''
  const type = (event && event.type) || ''
  const payload = (event && event.payload) || {}

  if (!robotCode) {
    return fail(2001, 'robotCode 不能为空')
  }

  if (!type) {
    return fail(2002, 'type 不能为空')
  }

  const allowedTypes = ['move', 'stop', 'goto']
  if (allowedTypes.indexOf(type) === -1) {
    return fail(2003, 'type 非法，只能为 move/stop/goto')
  }

  const robot = await getRobotByCode(robotCode)
  if (!robot) {
    return fail(2004, 'robotCode 不存在')
  }

  const now = Date.now()
  const limitTs = now - 500

  // 500ms 内相同 robotCode + type 节流
  const recentRes = await db
    .collection('commands')
    .where({
      robotCode,
      type,
      ts: dbCmd.gt(limitTs)
    })
    .limit(1)
    .get()

  if (recentRes.data && recentRes.data.length > 0) {
    return fail(2005, '同一机器人 500ms 内重复命令已被拒绝')
  }

  const doc = {
    robotCode,
    type,
    payload,
    status: 'pending',
    ts: now,
    createdAt: now,
    updateTime: now
  }

  const addRes = await db.collection('commands').add(doc)

  return success({
    commandId: addRes.id,
    robotCode,
    type,
    status: 'pending'
  })
}

async function handleBindRobotByCode(event, context) {
  const auth = await getAuthUid(context, event && event.uniIdToken)
  if (auth.code !== 0) {
    return auth
  }

  const uid = auth.data.uid
  const robotCode = String((event && event.robotCode) || '').trim()
  const bindSource = String((event && event.bindSource) || 'manual').trim() || 'manual'

  if (!robotCode) {
    return fail(3001, 'robotCode 不能为空')
  }

  const robot = await getRobotByCode(robotCode)
  if (!robot) {
    return fail(3002, '机器人不存在')
  }

  const existRes = await db
    .collection('robot_bindings')
    .where({
      uid,
      robotCode,
      status: 'active'
    })
    .limit(1)
    .get()

  if (existRes.data && existRes.data.length > 0) {
    return fail(3003, '已经绑定过该机器人')
  }

  const now = Date.now()
  const doc = {
    uid,
    robotId: robot._id || '',
    robotCode,
    bindSource,
    status: 'active',
    createdAt: now,
    updatedAt: now
  }

  const addRes = await db.collection('robot_bindings').add(doc)

  return success({
    bindingId: addRes.id,
    uid,
    robotId: doc.robotId,
    robotCode,
    bindSource,
    status: doc.status
  })
}

exports.main = async (event, context) => {
	console.log('EVENT_ACTION=', event && event.action, 'EVENT=', JSON.stringify(event))
  try {
    const action = (event && event.action) || ''

    if (!action) {
      return fail(9001, 'action 不能为空')
    }

    if (action === 'robotList') {
      return await handleRobotList()
    }

    if (action === 'robotDetail') {
      return await handleRobotDetail(event)
    }

    if (action === 'commandCreate') {
      return await handleCommandCreate(event)
    }

    if (action === 'bindRobotByCode') {
      return await handleBindRobotByCode(event, context)
    }

    return fail(9002, '未知的 action')
  } catch (err) {
    console.error('robot-service error:', err)
    return fail(5000, '服务器内部错误')
  }
}

