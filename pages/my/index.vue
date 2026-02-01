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

			<view class="item" @click="goRobots">
				<text class="label">机器人列表</text>
				<text class="value">查看所有机器人</text>
			</view>

			<view class="item" @click="showHelp">
				<text class="label">使用帮助</text>
				<text class="value">常见问题与说明</text>
			</view>

			<view class="item" @click="feedback">
				<text class="label">意见反馈</text>
				<text class="value">提交问题与建议</text>
			</view>
		</view>

		<view class="card">
			<view class="section-title">工具</view>

			<view class="item" @click="copyDeviceInfo">
				<text class="label">复制设备信息</text>
				<text class="value">{{ deviceSummary }}</text>
			</view>

			<view class="item danger" @click="clearCache">
				<text class="label">清除本地缓存</text>
				<text class="value">不会影响云端数据</text>
			</view>
		</view>

		<view class="footer">
			<text class="footer-text">Robot Charging Station</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const deviceSummary = ref('点击复制')

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

function clearCache() {
	uni.showModal({
		title: '清除本地缓存',
		content: '将清除本地存储（不影响云端数据）。是否继续？',
		success: (res) => {
			if (!res.confirm) return
			try {
				uni.clearStorageSync()
			} catch (e) {}
			uni.showToast({ title: '已清除', icon: 'success' })
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

