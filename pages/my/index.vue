<template>
	<view class="page">
		<view class="header">
			<image class="avatar" src="/static/my.png" mode="aspectFill"></image>
			<view class="meta">
				<view class="title">我的</view>
				<view class="sub">通用功能入口（不影响后端）</view>
			</view>
		</view>

		<view class="card">
			<view class="section-title">快捷入口</view>

			<view class="item" @tap="goRobots">
				<text class="label">机器人列表</text>
				<text class="value">查看所有机器人</text>
			</view>

			<view class="item" @tap="showHelp">
				<text class="label">使用帮助</text>
				<text class="value">常见问题与说明</text>
			</view>

			<view class="item" @tap="feedback">
				<text class="label">意见反馈</text>
				<text class="value">提交问题与建议</text>
			</view>
		</view>

		<view class="card">
			<view class="section-title">工具</view>

			<view class="item" @tap="copyDeviceInfo">
				<text class="label">复制设备信息</text>
				<text class="value">{{ deviceSummary }}</text>
			</view>

			<view class="item" @tap="bindTestRobot">
				<text class="label">绑定测试机器人</text>
				<text class="value">开发验收用（后续替换二维码绑定）</text>
			</view>

			<view class="item danger" @tap="logout">
				<text class="label">退出登录</text>
				<text class="value">清理登录态并返回登录页</text>
			</view>

			<view class="item danger" @tap="clearCache">
				<text class="label">清除本地缓存</text>
				<text class="value">不会影响云端数据</text>
			</view>
		</view>

		<view class="card">
			<view class="section-title">开发调试</view>

			<view class="item">
				<text class="label">登录状态</text>
				<text class="value">{{ debugLoginText }}</text>
			</view>

			<view class="item">
				<text class="label">uid</text>
				<text class="value">{{ profile?.uid || '-' }}</text>
			</view>

			<view class="item">
				<text class="label">username</text>
				<text class="value">{{ profile?.username || '-' }}</text>
			</view>

			<view class="item">
				<text class="label">nickname</text>
				<text class="value">{{ profile?.nickname || '-' }}</text>
			</view>
		</view>

		<view class="footer">
			<text class="footer-text">Robot Charging Station</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { isLoggedIn } from '@/utils/auth.js'

const TOKEN_KEY = 'uni_id_token'
const EXPIRED_KEY = 'uni_id_token_expired'
const REDIRECT_KEY = '_login_redirect_url_'

const userService = uniCloud.importObject('userService', {
	customUI: true,
	errorOptions: { type: 'toast' }
})

const deviceSummary = ref('点击复制')
const profile = ref(null)
const profileLoading = ref(false)

const debugLoginText = computed(() => {
	if (profileLoading.value) return '已登录（加载中…）'
	if (profile.value && profile.value.uid) return '已登录'
	return '未登录'
})

onMounted(() => {
	try {
		const info = uni.getSystemInfoSync()
		const model = info.model || ''
		const system = info.system || ''
		const platform = info.platform || ''
		deviceSummary.value = [platform, system, model].filter(Boolean).join(' / ') || '点击复制'
	} catch (e) {
		deviceSummary.value = '点击复制'
	}
})

onShow(() => {
	loadMyProfile()
})

async function loadMyProfile() {
	profileLoading.value = true
	try {
		const data = await userService.getMyProfile()
		profile.value = data || null
	} catch (e) {
		console.error('[my] getMyProfile failed:', e)
		profile.value = null
	} finally {
		profileLoading.value = false
	}
}

function goRobots() {
	uni.switchTab({ url: '/pages/robots/index' })
}

function showHelp() {
	uni.showModal({
		title: '使用帮助',
		content:
			'1. 在「机器人」页查看实时信息。\n2. 需要更多入口（设置/关于/隐私等）我可以继续补齐。\n3. 当前页面不涉及任何后端调用。',
		showCancel: false
	})
}

function feedback() {
	uni.showModal({
		title: '意见反馈',
		content: '你可以把问题描述发我，我再帮你把「反馈」页做成表单（仍不改后端）。',
		showCancel: false
	})
}

function copyDeviceInfo() {
	const text = deviceSummary.value || '未知设备'
	uni.setClipboardData({
		data: text,
		success: () => {
			uni.showToast({ title: '已复制', icon: 'success' })
		}
	})
}

async function bindTestRobot() {
	if (!isLoggedIn()) {
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}

	uni.showModal({
		title: '绑定测试机器人',
		content: '请输入 robotCode（例如 ROBOT-001）',
		editable: true,
		placeholderText: 'ROBOT-001',
		success: async (res) => {
			if (!res.confirm) return
			const robotCode = String(res.content || 'ROBOT-001').trim() || 'ROBOT-001'
			try {
				const r = await userService.bindRobotForTest(robotCode)
				if (r?.alreadyBound) {
					uni.showToast({ title: '已绑定（无需重复绑定）', icon: 'none' })
				} else {
					uni.showToast({ title: '绑定成功', icon: 'success' })
				}
			} catch (e) {
				uni.showToast({ title: e?.errMsg || e?.message || '绑定失败', icon: 'none' })
			}
		}
	})
}

function clearCache() {
	console.log('[my] clearCache tap')
	uni.showModal({
		title: '清除本地缓存',
		content: '将清除本地存储（不影响云端数据）。是否继续？',
		success: (res) => {
			if (!res.confirm) return
			console.log('[my] clearCache before', {
				uni_id_token: uni.getStorageSync(TOKEN_KEY),
				uni_id_token_expired: uni.getStorageSync(EXPIRED_KEY),
				_login_redirect_url_: uni.getStorageSync(REDIRECT_KEY)
			})

			// 清除本地缓存（全量清除）
			try {
				uni.clearStorageSync()
			} catch (e) {
				console.log('[my] clearCache uni.clearStorageSync error', e)
			}

			// 强制清理登录态三项 key（防御性兜底）
			try {
				uni.removeStorageSync(TOKEN_KEY)
				uni.removeStorageSync(EXPIRED_KEY)
				uni.removeStorageSync(REDIRECT_KEY)
			} catch (e) {
				console.log('[my] clearCache removeStorageSync error', e)
			}

			console.log('[my] clearCache after', {
				uni_id_token: uni.getStorageSync(TOKEN_KEY),
				uni_id_token_expired: uni.getStorageSync(EXPIRED_KEY),
				_login_redirect_url_: uni.getStorageSync(REDIRECT_KEY)
			})

			console.log('[my] clearCache reLaunch -> /pages/login/index')
			uni.reLaunch({ url: '/pages/login/index' })
		}
	})
}

function logout() {
	console.log('[my] logout tap')
	uni.showModal({
		title: '退出登录',
		content: '将清理本机登录态并返回登录页，是否继续？',
		success: (res) => {
			if (!res.confirm) return
			console.log('[my] logout before', {
				uni_id_token: uni.getStorageSync(TOKEN_KEY),
				uni_id_token_expired: uni.getStorageSync(EXPIRED_KEY),
				_login_redirect_url_: uni.getStorageSync(REDIRECT_KEY)
			})

			try {
				uni.removeStorageSync(TOKEN_KEY)
				uni.removeStorageSync(EXPIRED_KEY)
				uni.removeStorageSync(REDIRECT_KEY)
			} catch (e) {
				console.log('[my] logout removeStorageSync error', e)
			}

			console.log('[my] logout after', {
				uni_id_token: uni.getStorageSync(TOKEN_KEY),
				uni_id_token_expired: uni.getStorageSync(EXPIRED_KEY),
				_login_redirect_url_: uni.getStorageSync(REDIRECT_KEY)
			})

			console.log('[my] logout reLaunch -> /pages/login/index')
			uni.reLaunch({ url: '/pages/login/index' })
		}
	})
}
</script>

<style scoped>
.page {
	padding: 24rpx;
	background: #f6f7fb;
	min-height: 100vh;
	box-sizing: border-box;
}

.header {
	display: flex;
	align-items: center;
	padding: 24rpx;
	border-radius: 20rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.avatar {
	width: 104rpx;
	height: 104rpx;
	border-radius: 52rpx;
	background: #f0f0f0;
}

.meta {
	margin-left: 18rpx;
}

.title {
	font-size: 36rpx;
	font-weight: 700;
	color: #111827;
}

.sub {
	margin-top: 6rpx;
	font-size: 24rpx;
	color: #6b7280;
}

.card {
	margin-top: 18rpx;
	padding: 8rpx 0;
	border-radius: 20rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	overflow: hidden;
}

.section-title {
	padding: 20rpx 24rpx 10rpx;
	font-size: 26rpx;
	font-weight: 600;
	color: #111827;
}

.item {
	padding: 22rpx 24rpx;
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	border-top: 1rpx solid rgba(0, 0, 0, 0.06);
}

.label {
	font-size: 30rpx;
	color: #111827;
}

.value {
	margin-left: 18rpx;
	font-size: 24rpx;
	color: #6b7280;
	text-align: right;
	max-width: 420rpx;
}

.danger .label {
	color: #ef4444;
}

.footer {
	margin-top: 28rpx;
	padding-bottom: 10rpx;
	display: flex;
	justify-content: center;
}

.footer-text {
	font-size: 22rpx;
	color: #9ca3af;
}
</style>

