/**
 * robot-service 云函数调用封装（Phase 4）
 * - 统一错误处理：code != 0 toast message；网络/异常 toast
 * - 页面只关心成功 data
 */

function toast(message) {
	uni.showToast({
		title: message || '请求失败',
		icon: 'none',
		duration: 2000
	})
}

export async function callRobotService(data) {
	try {
		const res = await uniCloud.callFunction({
			name: 'robot-service',
			data
		})

		// uniCloud callFunction 返回结构：{ result: { code, data, message } }
		const result = res && res.result ? res.result : null
		if (!result) {
			toast('服务返回异常')
			return null
		}

		if (result.code !== 0) {
			toast(result.message || '请求失败')
			return null
		}

		return result.data
	} catch (e) {
		console.error('callRobotService error:', e)
		toast('网络异常，请稍后重试')
		return null
	}
}

