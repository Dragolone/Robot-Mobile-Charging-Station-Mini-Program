/**
 * 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
 *
 * userService（用户相关云对象）
 * - 后续所有“获取用户信息/用户数据查询”等操作统一收口到这里
 * - 安全原则：不信任前端参数；禁止前端传 uid/userId；所有用户数据操作必须基于 token 解密后的 uid
 */
'use strict'

const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command
const $ = dbCmd.aggregate

function fail(errMsg, errCode = 1, data = {}) {
	return { errCode, errMsg, ...data }
}

function asNumberOrNull(value) {
	if (value === null || value === undefined || value === '') return null
	const num = Number(value)
	return Number.isNaN(num) ? null : num
}

function asText(value) {
	if (value === null || value === undefined) return ''
	return String(value).trim()
}

function formatLocationText(x, y) {
	if (x === null && y === null) return '暂无数据'
	return `X: ${x === null ? '-' : x}, Y: ${y === null ? '-' : y}`
}

function normalizeTelemetryLatest(rawTelemetry) {
	const raw = rawTelemetry && typeof rawTelemetry === 'object' ? rawTelemetry : null
	const robotCode = asText(raw?.robotCode)
	const vehicleBattery = asNumberOrNull(raw?.vehicleBattery)
	const packBattery = asNumberOrNull(raw?.packBattery)
	const x = null
	const y = null
	const isOnline = false
	const lastOnlineTime = asText(raw?.lastSeen || raw?.updateTime || raw?.ts)

	return {
		robotCode,
		isOnline,
		onlineStatusText: isOnline ? '在线' : '离线',
		vehicleBattery,
		packBattery,
		x,
		y,
		locationText: formatLocationText(x, y),
		faultCount: 0,
		lastOnlineTime,
		taskStatus: '',
		rawTelemetry: raw ? { ...raw } : null,
		// 向后兼容当前前端已有取值方式
		lastSeen: lastOnlineTime
	}
}

module.exports = {
	/**
	 * 通用预处理器：统一鉴权
	 * - 不允许前端传 uid/userId 来获取数据
	 * - 后端通过 token 校验并拿到 uid，后续方法统一使用 this.auth.uid
	 */
	_before: async function () {
		const clientInfo = this.getClientInfo()
		const token = this.getUniIdToken()

		if (!token) {
			throw fail('未登录', 30201)
		}

		const uniIDIns = uniID.createInstance({ clientInfo })
		const tokenRes = await uniIDIns.checkToken(token)
		if (!tokenRes || tokenRes.errCode !== 0 || !tokenRes.uid) {
			throw fail(tokenRes?.message || '登录状态失效', tokenRes?.errCode || 30202)
		}

		// 统一挂载鉴权信息，后续所有用户数据读写必须基于这里的 uid
		this.auth = {
			uid: tokenRes.uid,
			tokenRes
		}
	},

	/**
	 * 通用后处理器：统一错误格式
	 */
	_after: function (error, result) {
		if (error) {
			if (error.errCode) return error
			if (error instanceof Error) {
				return fail(error.message || '服务异常', 'error')
			}
			throw error
		}
		return result
	},

	/**
	 * 绑定机器人（测试用）
	 * - 使用 this.auth.uid
	 * - 不信任前端 uid/userId 参数（不接收也不使用）
	 */
	async bindRobotForTest(robotCode) {
		const uid = this.auth.uid
		const code = String(robotCode || '').trim()
		if (!code) throw fail('robotCode 不能为空', 400)

		const now = Date.now()

		// 1) 机器人是否存在
		const robotRes = await db.collection('robots').where({ robotCode: code }).limit(1).get()
		if (!robotRes.data || robotRes.data.length === 0) {
			throw fail('robotCode 不存在', 404)
		}

		// 2) 当前 uid 是否已绑定该 robotCode
		const myBindRes = await db
			.collection('robot_bindings')
			.where({ uid, robotCode: code, status: 'active' })
			.limit(1)
			.get()
		if (myBindRes.data && myBindRes.data.length > 0) {
			return {
				alreadyBound: true,
				robotCode: code,
				uid
			}
		}

		// 3) robotCode 是否已被其他 uid 绑定
		const anyBindRes = await db
			.collection('robot_bindings')
			.where({ robotCode: code, status: 'active' })
			.limit(1)
			.get()
		if (anyBindRes.data && anyBindRes.data.length > 0) {
			const exist = anyBindRes.data[0]
			if (exist.uid && exist.uid !== uid) {
				throw fail('该机器人已被其他用户绑定', 409)
			}
		}

		// 4) 创建绑定
		const doc = {
			uid,
			robotCode: code,
			bindTime: now,
			status: 'active',
			source: 'test',
			createTime: now,
			updateTime: now
		}
		const addRes = await db.collection('robot_bindings').add(doc)

		return {
			created: true,
			bindingId: addRes.id,
			robotCode: code,
			uid
		}
	},

	/**
	 * 获取当前登录用户绑定的机器人列表
	 * - 使用 this.auth.uid
	 */
	async listMyRobots() {
		const uid = this.auth.uid

		// 1) 查绑定
		const bindingsRes = await db
			.collection('robot_bindings')
			.where({ uid, status: 'active' })
			.field({ robotCode: true })
			.get()

		const robotCodes = (bindingsRes.data || [])
			.map((b) => String(b.robotCode || '').trim())
			.filter(Boolean)

		if (robotCodes.length === 0) {
			return { list: [] }
		}

		// 2) 查 robots
		const robotsRes = await db
			.collection('robots')
			.where({ robotCode: dbCmd.in(robotCodes) })
			.get()
		const robots = robotsRes.data || []
		const robotMap = {}
		robots.forEach((r) => {
			if (r && r.robotCode) robotMap[r.robotCode] = r
		})

		// 3) 查 telemetry_latest
		const telemetryRes = await db
			.collection('telemetry_latest')
			.where({ robotCode: dbCmd.in(robotCodes) })
			.get()
		const telemetryMap = {}
		;(telemetryRes.data || []).forEach((t) => {
			if (t && t.robotCode) telemetryMap[t.robotCode] = t
		})

		// 4) faultCount（聚合）
		const faultsAggRes = await db
			.collection('faults')
			.aggregate()
			.match({ robotCode: dbCmd.in(robotCodes) })
			.group({ _id: '$robotCode', count: $.sum(1) })
			.end()
		const faultCountMap = {}
		;(faultsAggRes.data || []).forEach((item) => {
			faultCountMap[item._id] = item.count
		})

		// 5) 按绑定顺序组装（且只返回属于该 uid 的 robots）
		const list = robotCodes
			.map((code) => {
				const robot = robotMap[code]
				if (!robot) return null
				const faultCount = faultCountMap[code] || 0
				const normalizedTelemetry = normalizeTelemetryLatest(telemetryMap[code])
				return {
					robotCode: robot.robotCode,
					model: robot.model,
					online: robot.online,
					location: robot.location,
					telemetry_latest: {
						...normalizedTelemetry,
						robotCode: normalizedTelemetry.robotCode || robot.robotCode,
						isOnline: !!robot.online,
						onlineStatusText: robot.online ? '在线' : '离线'
					},
					faultCount
				}
			})
			.filter(Boolean)

		return { list }
	},

	/**
	 * 获取当前用户的机器人详情
	 * - 使用 this.auth.uid
	 * - 先校验 robotCode 是否属于当前 uid
	 */
	async getMyRobotDetail(robotCode) {
		const uid = this.auth.uid
		const code = String(robotCode || '').trim()
		if (!code) throw fail('robotCode 不能为空', 400)

		// 1) 校验归属
		const bindRes = await db
			.collection('robot_bindings')
			.where({ uid, robotCode: code, status: 'active' })
			.limit(1)
			.get()
		if (!bindRes.data || bindRes.data.length === 0) {
			throw fail('无权限访问该机器人', 403)
		}

		// 2) 取 robot
		const robotRes = await db.collection('robots').where({ robotCode: code }).limit(1).get()
		const robot = robotRes.data && robotRes.data.length ? robotRes.data[0] : null
		if (!robot) throw fail('robotCode 不存在', 404)

		// 3) 取 telemetry_latest
		const telemetryRes = await db
			.collection('telemetry_latest')
			.where({ robotCode: code })
			.orderBy('ts', 'desc')
			.limit(1)
			.get()
		const telemetry_latest =
			telemetryRes.data && telemetryRes.data.length ? telemetryRes.data[0] : null

		// 4) 最近 faults
		const faultsRes = await db
			.collection('faults')
			.where({ robotCode: code })
			.orderBy('ts', 'desc')
			.limit(20)
			.get()
		const normalizedTelemetry = normalizeTelemetryLatest(telemetry_latest)

		return {
			robot,
			telemetry_latest: {
				...normalizedTelemetry,
				robotCode: normalizedTelemetry.robotCode || robot.robotCode,
				isOnline: !!robot.online,
				onlineStatusText: robot.online ? '在线' : '离线'
			},
			faults: faultsRes.data || []
		}
	},

	/**
	 * 获取当前登录用户信息（开发调试用）
	 * - 必须基于 this.auth.uid
	 */
	async getMyProfile() {
		const uid = this.auth.uid
		const res = await db
			.collection('uni-id-users')
			.where({ _id: uid })
			.field({
				username: true,
				nickname: true,
				avatar: true,
				mobile: true
			})
			.limit(1)
			.get()

		const user = res.data && res.data.length ? res.data[0] : null

		return {
			uid,
			username: user?.username || '',
			nickname: user?.nickname || '',
			avatar: user?.avatar || '',
			mobile: user?.mobile || ''
		}
	},

	/**
	 * 更新当前登录用户资料
	 * - 仅允许修改 nickname / avatar
	 * - 必须基于 this.auth.uid，禁止前端传 uid 指定他人
	 */
	async updateMyProfile(data = {}) {
		const uid = this.auth.uid
		const payload = data && typeof data === 'object' ? data : {}

		if (payload.uid || payload.userId || payload._id) {
			// 明确拒绝“试图指定 uid”的行为
			throw fail('不允许指定 uid 更新资料', 403)
		}

		const updateDoc = {
			updateTime: Date.now()
		}
		const responseData = {
			ok: true,
			uid
		}
		let hasUpdatableField = false

		if (Object.prototype.hasOwnProperty.call(payload, 'nickname')) {
			let nickname = payload.nickname
			if (typeof nickname !== 'string') nickname = String(nickname ?? '')
			nickname = nickname.trim()
			if (!nickname) throw fail('昵称不能为空', 400)
			if (nickname.length < 1 || nickname.length > 20) {
				throw fail('昵称长度需为 1~20', 400)
			}
			updateDoc.nickname = nickname
			responseData.nickname = nickname
			hasUpdatableField = true
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'avatar')) {
			let avatar = payload.avatar
			if (typeof avatar !== 'string') avatar = String(avatar ?? '')
			avatar = avatar.trim()
			if (avatar) {
				updateDoc.avatar = avatar
				responseData.avatar = avatar
				hasUpdatableField = true
			}
		}

		if (!hasUpdatableField) {
			throw fail('未提供可更新的资料字段', 400)
		}

		await db.collection('uni-id-users').doc(uid).update(updateDoc)

		return responseData
	},
	/**
	 * 测试连通性（仅用于开发阶段）
	 * - 前端可调用
	 * - 会自动触发 _before（鉴权）
	 */
	async ping() {
		return {
		ok: true,
		uid: this.auth.uid
		}
	}
	// 仅创建基础结构：暂不提供具体业务方法
}

