<template>
	<view class="page">
		<view class="header pressable-surface" hover-class="pressable-surface-hover" @tap="goProfile">
			<image class="avatar" :src="displayAvatar" mode="aspectFill"></image>
			<view class="meta">
				<view class="title">{{ displayNickname }}</view>
				<view class="sub">{{ displayUsername }}</view>
				<view class="hint">点击查看个人资料</view>
			</view>
		</view>

		<view class="card">
			<view class="section-title">快捷入口</view>

			<view class="item pressable-row" hover-class="pressable-row-hover" @tap="goRobots">
				<text class="label">机器人列表</text>
				<text class="value">查看所有机器人</text>
			</view>

			<view class="item pressable-row" hover-class="pressable-row-hover" @tap="showHelp">
				<text class="label">使用帮助</text>
				<text class="value">常见问题与说明</text>
			</view>

			<view class="item pressable-row" hover-class="pressable-row-hover" @tap="feedback">
				<text class="label">意见反馈</text>
				<text class="value">提交问题与建议</text>
			</view>
		</view>

		<view class="card">
			<view class="section-title">工具</view>

			<view class="item pressable-row" hover-class="pressable-row-hover" @tap="copyDeviceInfo">
				<text class="label">复制设备信息</text>
				<text class="value">{{ deviceSummary }}</text>
			</view>

			<view class="item pressable-row" hover-class="pressable-row-hover" @tap="openBindRobotSheet">
				<text class="label">绑定机器人</text>
				<text class="value">手动输入设备编号或扫码绑定</text>
			</view>

			<view class="item pressable-row danger" hover-class="pressable-row-hover" @tap="logout">
				<text class="label">退出登录</text>
				<text class="value">清理登录态并返回登录页</text>
			</view>

			<view class="item pressable-row danger" hover-class="pressable-row-hover" @tap="clearCache">
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

		<BindRobotSheet :visible="bindSheetVisible" @close="closeBindSheet" />
	</view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { isLoggedIn } from '@/utils/auth.js'
import BindRobotSheet from '@/components/BindRobotSheet.vue'

const TOKEN_KEY = 'uni_id_token'
const EXPIRED_KEY = 'uni_id_token_expired'
const REDIRECT_KEY = '_login_redirect_url_'
const DEFAULT_AVATAR = '/static/default-avatar.png'

const userService = uniCloud.importObject('userService', {
	customUI: true,
	errorOptions: { type: 'toast' }
})
const userServiceSilent = uniCloud.importObject('userService', {
	customUI: true,
	errorOptions: { type: 'none' }
})

const deviceSummary = ref('点击复制')
const profile = ref(null)
const profileLoading = ref(false)
const lastFetchAt = ref(0)
const bindSheetVisible = ref(false)

const displayUsername = computed(() => profile.value?.username || '-')
const displayNickname = computed(() => {
	const nickname = String(profile.value?.nickname || '').trim()
	if (nickname) return nickname

	const username = String(profile.value?.username || '').trim()
	if (username) return username

	return profileLoading.value ? '加载中…' : '未登录'
})
const displayAvatar = computed(() => {
	const avatar = String(profile.value?.avatar || '').trim()
	return avatar || DEFAULT_AVATAR
})

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

	// 个人资料页保存后立即同步本地展示（无需引入全局状态）
	uni.$on('profile:updated', onProfileUpdated)
})

onShow(() => {
	loadMyProfile()
})

async function loadMyProfile() {
	// 避免短时间重复触发造成闪烁/多次报错
	if (profileLoading.value) return
	const now = Date.now()
	if (now - lastFetchAt.value < 800) return
	lastFetchAt.value = now

	if (!isLoggedIn()) {
		profile.value = null
		profileLoading.value = false
		return
	}

	profileLoading.value = true
	try {
		const data = await userServiceSilent.getMyProfile()
		profile.value = data || null
	} catch (e) {
		console.error('[my] getMyProfile failed:', e)
		// 有旧数据就保留，避免顶部闪烁；首次失败则保持占位
	} finally {
		profileLoading.value = false
	}
}

function onProfileUpdated(payload) {
	try {
		const nickname = String(payload?.nickname || '').trim()
		const avatar = String(payload?.avatar || '').trim()
		if (!profile.value) profile.value = {}
		if (nickname) profile.value.nickname = nickname
		if (avatar) profile.value.avatar = avatar
	} catch (e) {
		console.log('[my] onProfileUpdated error', e)
	}
}

onBeforeUnmount(() => {
	uni.$off('profile:updated', onProfileUpdated)
})

function goRobots() {
	uni.switchTab({ url: '/pages/robots/index' })
}

function goProfile() {
	if (!isLoggedIn()) {
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}
	uni.navigateTo({ url: '/pages/profile/index' })
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

async function openBindRobotSheet() {
	if (!isLoggedIn()) {
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}

	bindSheetVisible.value = true
}

function closeBindSheet() {
	bindSheetVisible.value = false
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
@import '@/styles/pressable.css';
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

.hint {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #9ca3af;
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

