<template>
	<view class="page">
		<view class="header">
			<image class="avatar" :src="displayAvatar" mode="aspectFill"></image>
			<view class="meta">
				<view class="title">{{ displayNickname }}</view>
				<view class="sub">{{ displayUsername }}</view>
			</view>
		</view>

		<view class="card">
			<view class="section-title">资料信息</view>

			<view class="item">
				<text class="label">uid</text>
				<text class="value">{{ profile?.uid || '-' }}</text>
			</view>

			<view class="item">
				<text class="label">用户名</text>
				<text class="value">{{ profile?.username || '-' }}</text>
			</view>

			<view class="item clickable" hover-class="item-hover" @tap="goEditNickname">
				<text class="label">昵称</text>
				<view class="right">
					<text class="value">{{ displayNickname }}</text>
					<text class="arrow">›</text>
				</view>
			</view>
		</view>

		<view v-if="loadFailed" class="tip">
			<text class="tip-text">资料加载失败，请稍后重试</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { isLoggedIn } from '@/utils/auth.js'

const DEFAULT_AVATAR = '/static/default-avatar.png'

const userService = uniCloud.importObject('userService', {
	customUI: true,
	errorOptions: { type: 'none' }
})

const profile = ref(null)
const loading = ref(false)
const loadFailed = ref(false)
const lastFetchAt = ref(0)

const displayUsername = computed(() => profile.value?.username || '-')
const displayNickname = computed(() => {
	const nickname = String(profile.value?.nickname || '').trim()
	if (nickname) return nickname
	const username = String(profile.value?.username || '').trim()
	return username || '未登录'
})
const displayAvatar = computed(() => {
	const avatar = String(profile.value?.avatar || '').trim()
	return avatar || DEFAULT_AVATAR
})

onLoad(() => {
	loadMyProfile()
})

onShow(() => {
	// 页面每次显示时尽量刷新一次（带节流，避免明显闪烁/重复报错）
	loadMyProfile({ silent: true })
})

async function loadMyProfile(options = {}) {
	const { silent = false } = options
	loadFailed.value = false

	if (!isLoggedIn()) {
		profile.value = null
		if (!silent) {
			uni.showToast({ title: '请先登录', icon: 'none' })
			uni.navigateTo({ url: '/pages/login/index' })
		}
		return
	}

	if (loading.value) return
	const now = Date.now()
	if (now - lastFetchAt.value < 800) return
	lastFetchAt.value = now

	loading.value = true
	try {
		const data = await userService.getMyProfile()
		profile.value = data || null
	} catch (e) {
		console.error('[profile] getMyProfile failed:', e)
		loadFailed.value = true
		// 保留旧数据显示，避免空白/闪烁；首次失败则保持占位
		if (!profile.value) {
			profile.value = null
		}
		uni.showToast({ title: '资料加载失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

function goEditNickname() {
	if (!isLoggedIn()) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}
	const nickname = encodeURIComponent(String(profile.value?.nickname || '').trim())
	uni.navigateTo({ url: `/pages/profile/edit-nickname?nickname=${nickname}` })
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
	width: 112rpx;
	height: 112rpx;
	border-radius: 56rpx;
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

.clickable {
	cursor: pointer;
}

.item-hover {
	background: rgba(0, 0, 0, 0.03);
}

.right {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex: 1;
	margin-left: 18rpx;
}

.arrow {
	margin-left: 10rpx;
	font-size: 34rpx;
	line-height: 1;
	color: #c7c7cc; /* iOS 右箭头灰 */
}

.tip {
	margin-top: 18rpx;
	padding: 18rpx 24rpx;
	border-radius: 16rpx;
	background: rgba(239, 68, 68, 0.08);
}

.tip-text {
	font-size: 24rpx;
	color: #b91c1c;
}
</style>

