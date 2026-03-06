/**
 * 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
 *
 * userService（用户相关云对象）
 * - 后续所有“获取用户信息/用户数据查询”等操作统一收口到这里
 * - 安全原则：不信任前端参数；禁止前端传 uid/userId；所有用户数据操作必须基于 token 解密后的 uid
 */
'use strict'

const uniID = require('uni-id-common')

function fail(errMsg, errCode = 1, data = {}) {
	return { errCode, errMsg, ...data }
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

