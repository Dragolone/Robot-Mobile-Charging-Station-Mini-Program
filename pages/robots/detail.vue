<template>
	<view class="container">
		<scroll-view scroll-y class="scroll-content">
			<view class="page-content">
				<view class="hero-card">
					<view class="hero-header">
						<view class="hero-main">
							<text class="hero-caption">机器人主信息</text>
							<text class="hero-code">{{ displayText(robotDetail?.robotCode) }}</text>
							<text class="hero-model">{{ displayText(robotDetail?.model) }}</text>
						</view>
						<view class="status-badge" :class="robotDetail?.online ? 'is-online' : 'is-offline'">
							{{ getOnlineStatusText(robotDetail?.online) }}
						</view>
					</view>
					<view class="hero-meta">
						<view class="hero-meta-item hero-meta-item-wide">
							<text class="meta-label">最后在线时间</text>
							<text class="meta-value meta-value-time">{{ formatDisplayTime(robotDetail?.lastSeen) }}</text>
						</view>
						<view class="hero-meta-item">
							<text class="meta-label">当前任务状态</text>
							<text class="meta-value">{{ getTaskStatusText() }}</text>
						</view>
					</view>
				</view>

				<view class="section">
					<view class="section-title">状态概览</view>
					<view class="overview-grid">
						<view class="overview-card">
							<text class="overview-label">车体电量</text>
							<text class="overview-value">{{ displayBattery(robotDetail?.vehicleBattery) }}</text>
						</view>
						<view class="overview-card">
							<text class="overview-label">电池包电量</text>
							<text class="overview-value">{{ displayBattery(robotDetail?.packBattery) }}</text>
						</view>
						<view class="overview-card">
							<text class="overview-label">故障数量</text>
							<text class="overview-value" :class="{ 'has-fault': faults.length > 0 }">
								{{ getFaultCountText() }}
							</text>
						</view>
						<view class="overview-card">
							<text class="overview-label">当前坐标</text>
							<text class="overview-value overview-location">{{ formatLocation(robotDetail?.location) }}</text>
						</view>
					</view>
				</view>

				<view class="section">
					<view class="section-title">设备信息明细</view>
					<view class="panel-card">
						<view class="detail-row">
							<text class="detail-label">设备编号</text>
							<text class="detail-value">{{ displayText(robotDetail?.robotCode) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">型号</text>
							<text class="detail-value">{{ displayText(robotDetail?.model) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">联网状态</text>
							<text class="detail-value" :class="robotDetail?.online ? 'text-online' : 'text-offline'">
								{{ getOnlineStatusText(robotDetail?.online) }}
							</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">最后在线时间</text>
							<text class="detail-value">{{ formatDisplayTime(robotDetail?.lastSeen) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">车体电量</text>
							<text class="detail-value">{{ displayBattery(robotDetail?.vehicleBattery) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">电池包电量</text>
							<text class="detail-value">{{ displayBattery(robotDetail?.packBattery) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">当前位置</text>
							<text class="detail-value location-text">{{ formatLocation(robotDetail?.location) }}</text>
						</view>
					</view>
				</view>

				<view class="section">
					<view class="section-title">故障信息</view>
					<view class="panel-card">
						<view class="fault-summary">
							<text class="fault-summary-label">当前故障数量</text>
							<text class="fault-summary-value" :class="{ 'has-fault': faults.length > 0 }">
								{{ getFaultCountText() }}
							</text>
						</view>
						<view v-if="faults.length > 0" class="fault-list">
							<view
								v-for="(fault, index) in faults"
								:key="index"
								class="fault-item"
							>
								<view class="fault-item-header">
									<text class="fault-code">{{ displayText(fault.code) }}</text>
									<text class="fault-time">{{ formatDisplayTime(fault.time || fault.ts) }}</text>
								</view>
								<view class="fault-message">{{ displayText(fault.message) }}</view>
							</view>
						</view>
						<view v-else class="empty-state">
							<text class="empty-state-title">暂无数据</text>
							<text class="empty-state-desc">当前没有可展示的故障信息</text>
						</view>
					</view>
				</view>

				<view class="section">
					<view class="section-title">设备控制</view>
					<view class="panel-card">
						<view class="control-head">
							<text class="control-title">方向控制</text>
							<text class="control-status">{{ robotDetail?.online ? '在线可控制' : '离线不可控制' }}</text>
						</view>
						<view class="direction-control">
							<view class="direction-row">
								<button
									class="direction-btn"
									:disabled="!robotDetail?.online"
									@click="handleDirection('forward')"
								>
									前进
								</button>
							</view>
							<view class="direction-row">
								<button
									class="direction-btn"
									:disabled="!robotDetail?.online"
									@click="handleDirection('left')"
								>
									左转
								</button>
								<button
									class="direction-btn stop-btn"
									:disabled="!robotDetail?.online"
									@click="handleDirection('stop')"
								>
									停止
								</button>
								<button
									class="direction-btn"
									:disabled="!robotDetail?.online"
									@click="handleDirection('right')"
								>
									右转
								</button>
							</view>
							<view class="direction-row">
								<button
									class="direction-btn"
									:disabled="!robotDetail?.online"
									@click="handleDirection('backward')"
								>
									后退
								</button>
							</view>
						</view>
					</view>
				</view>

				<view class="section">
					<view class="section-title">发送点位</view>
					<view class="panel-card">
						<view class="send-position-head">
							<text class="control-title">目标点位</text>
							<text class="control-status">{{ robotDetail?.online ? '在线可发送' : '离线不可发送' }}</text>
						</view>
						<view class="position-input-group">
							<view class="input-item">
								<text class="input-label">X坐标</text>
								<input
									class="input-field"
									type="digit"
									v-model="positionX"
									placeholder="请输入X坐标"
									:disabled="!robotDetail?.online"
								/>
							</view>
							<view class="input-item">
								<text class="input-label">Y坐标</text>
								<input
									class="input-field"
									type="digit"
									v-model="positionY"
									placeholder="请输入Y坐标"
									:disabled="!robotDetail?.online"
								/>
							</view>
							<button
								class="send-btn"
								:disabled="!robotDetail?.online"
								@click="handleSendPosition"
							>
								发送点位
							</button>
						</view>
					</view>
				</view>

				<view class="section section-last">
					<view class="section-title">位置示意</view>
					<view class="map-card">
						<view class="map-head">
							<text class="map-title">当前位置</text>
							<text class="map-subtitle">{{ formatLocation(robotDetail?.location) }}</text>
						</view>
						<view class="map-placeholder">
							<text class="map-placeholder-title">位置示意</text>
							<text class="map-placeholder-desc">用于展示机器人当前位置信息，当前坐标：{{ formatLocation(robotDetail?.location) }}</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { formatBattery } from '@/utils/format.js'
import { callRobotService } from '@/services/robotService.js'
import { ensureLoginForCurrentPage } from '@/utils/auth.js'

const robotCode = ref('')
const robotDetail = ref(null)
const positionX = ref('')
const positionY = ref('')
const faults = ref([])

const EMPTY_TEXT = '暂无数据'

const userService = uniCloud.importObject('userService', {
	customUI: true,
	errorOptions: { type: 'toast' }
})

onShow(() => {
	if (!ensureLoginForCurrentPage()) return
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = currentPage.options || {}
	robotCode.value = options.robotCode || ''
	
	if (robotCode.value) {
		loadRobotDetail()
	}
})

async function loadRobotDetail() {
	try {
		const data = await userService.getMyRobotDetail(robotCode.value)
		const robot = data.robot || {}
		const telemetry = data.telemetry_latest || {}

		faults.value = data.faults || []
		robotDetail.value = {
			...robot,
			vehicleBattery: telemetry.vehicleBattery,
			packBattery: telemetry.packBattery,
			lastSeen: telemetry.lastSeen
		}
	} catch (e) {
		uni.showToast({ title: e?.errMsg || e?.message || '获取详情失败', icon: 'none' })
		robotDetail.value = null
		faults.value = []
	}
}

function hasDisplayValue(value) {
	if (value === null || value === undefined) return false
	if (typeof value === 'number') return !Number.isNaN(value)
	return String(value).trim() !== ''
}

function displayText(value, fallback = EMPTY_TEXT) {
	if (!hasDisplayValue(value)) return fallback
	return String(value)
}

function displayBattery(value) {
	if (!hasDisplayValue(value)) return EMPTY_TEXT
	return `${formatBattery(value)}%`
}

function formatDisplayTime(value) {
	if (!hasDisplayValue(value)) return EMPTY_TEXT

	let date = null

	if (value instanceof Date) {
		date = value
	} else if (typeof value === 'number') {
		const timestamp = String(value).length === 10 ? value * 1000 : value
		date = new Date(timestamp)
	} else {
		const rawValue = String(value).trim()
		if (!rawValue) return EMPTY_TEXT

		if (/^\d{10,13}$/.test(rawValue)) {
			const timestamp = rawValue.length === 10 ? Number(rawValue) * 1000 : Number(rawValue)
			date = new Date(timestamp)
		} else {
			const matched = rawValue.match(
				/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
			)

			if (matched) {
				const [, year, month, day, hour = '0', minute = '0', second = '0'] = matched
				date = new Date(
					Number(year),
					Number(month) - 1,
					Number(day),
					Number(hour),
					Number(minute),
					Number(second)
				)
			} else {
				const normalizedValue = rawValue.replace(/-/g, '/').replace('T', ' ')
				date = new Date(normalizedValue)
			}
		}
	}

	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		return EMPTY_TEXT
	}

	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')
	const hour = `${date.getHours()}`.padStart(2, '0')
	const minute = `${date.getMinutes()}`.padStart(2, '0')
	const second = `${date.getSeconds()}`.padStart(2, '0')

	return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function formatCoordinate(value) {
	if (!hasDisplayValue(value)) return EMPTY_TEXT

	const numericValue = Number(value)
	if (Number.isNaN(numericValue)) {
		return String(value)
	}

	const fixedValue = numericValue.toFixed(2).replace(/\.?0+$/, '')
	return fixedValue || '0'
}

function formatLocation(location) {
	const x = formatCoordinate(location?.x)
	const y = formatCoordinate(location?.y)

	if (x === EMPTY_TEXT && y === EMPTY_TEXT) {
		return EMPTY_TEXT
	}

	return `X: ${x} / Y: ${y}`
}

function getOnlineStatusText(online) {
	return online ? '在线' : '离线'
}

function getTaskStatusText() {
	return EMPTY_TEXT
}

function getFaultCountText() {
	return String((faults.value && faults.value.length) || 0)
}

async function handleDirection(direction) {
	if (!robotDetail.value?.online) {
		uni.showToast({
			title: '设备离线不可控制',
			icon: 'none',
			duration: 2000
		})
		return
	}
	
	const directionMap = {
		forward: '前进',
		backward: '后退',
		left: '左转',
		right: '右转',
		stop: '停止'
	}

	const type = direction === 'stop' ? 'stop' : 'move'
	const payload = direction === 'stop' ? {} : { direction }
	const data = await callRobotService({
		action: 'commandCreate',
		robotCode: robotCode.value,
		type,
		payload
	})
	if (!data) return

	uni.showToast({
		title: `已发送${directionMap[direction]}`,
		icon: 'success',
		duration: 1500
	})
}

async function handleSendPosition() {
	if (!robotDetail.value?.online) {
		uni.showToast({
			title: '设备离线不可控制',
			icon: 'none',
			duration: 2000
		})
		return
	}
	
	if (!positionX.value || !positionY.value) {
		uni.showToast({
			title: '请输入完整的坐标',
			icon: 'none',
			duration: 2000
		})
		return
	}

	const payload = {
		x: Number(positionX.value),
		y: Number(positionY.value)
	}
	const data = await callRobotService({
		action: 'commandCreate',
		robotCode: robotCode.value,
		type: 'goto',
		payload
	})
	if (!data) return

	uni.showToast({
		title: `已发送点位: (${payload.x}, ${payload.y})`,
		icon: 'success',
		duration: 1500
	})
	
	// 清空输入
	positionX.value = ''
	positionY.value = ''
}
</script>

<style scoped>
.container {
	height: 100vh;
	background-color: #f3f4f6;
}

.scroll-content {
	height: 100%;
}

.page-content {
	padding: 24rpx 24rpx 32rpx;
}

.section {
	margin-top: 24rpx;
}

.section-last {
	padding-bottom: 24rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 16rpx;
}

button::after {
	border: none;
}

.hero-card,
.panel-card,
.map-card {
	background-color: #ffffff;
	border-radius: 24rpx;
	border: 1rpx solid #e5e7eb;
	box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.hero-card {
	padding: 28rpx;
}

.hero-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 24rpx;
}

.hero-main {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	flex: 1;
}

.hero-caption {
	font-size: 24rpx;
	color: #6b7280;
}

.hero-code {
	font-size: 40rpx;
	font-weight: 600;
	color: #111827;
	line-height: 1.3;
}

.hero-model {
	font-size: 26rpx;
	color: #4b5563;
}

.status-badge {
	padding: 10rpx 20rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	font-weight: 600;
	line-height: 1.2;
	white-space: nowrap;
}

.status-badge.is-online {
	background-color: #ecfdf3;
	color: #047857;
}

.status-badge.is-offline {
	background-color: #f3f4f6;
	color: #6b7280;
}

.hero-meta {
	margin-top: 28rpx;
	padding-top: 24rpx;
	border-top: 1rpx solid #f1f5f9;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
}

.hero-meta-item {
	padding: 20rpx;
	border-radius: 18rpx;
	background-color: #f8fafc;
}

.hero-meta-item-wide {
	grid-column: 1 / -1;
}

.meta-label {
	display: block;
	font-size: 24rpx;
	color: #6b7280;
	margin-bottom: 10rpx;
}

.meta-value {
	font-size: 28rpx;
	color: #111827;
	font-weight: 500;
	line-height: 1.4;
	word-break: break-all;
}

.meta-value-time {
	font-size: 26rpx;
	white-space: nowrap;
	word-break: normal;
}

.overview-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
}

.overview-card {
	background-color: #ffffff;
	border-radius: 20rpx;
	border: 1rpx solid #e5e7eb;
	padding: 24rpx;
	min-height: 156rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.03);
}

.overview-label {
	font-size: 24rpx;
	color: #6b7280;
	line-height: 1.4;
}

.overview-value {
	font-size: 32rpx;
	font-weight: 600;
	color: #111827;
	line-height: 1.35;
	word-break: break-all;
}

.overview-value.has-fault {
	color: #b45309;
}

.overview-location {
	font-size: 26rpx;
}

.panel-card {
	padding: 28rpx;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 24rpx;
	padding: 22rpx 0;
	border-bottom: 1rpx solid #f1f5f9;
}

.detail-row:last-child {
	border-bottom: none;
}

.detail-label {
	font-size: 28rpx;
	color: #6b7280;
	min-width: 160rpx;
}

.detail-value {
	font-size: 28rpx;
	color: #111827;
	font-weight: 500;
	text-align: right;
	flex: 1;
	line-height: 1.45;
	word-break: break-all;
}

.location-text {
	color: #374151;
}

.text-online {
	color: #047857;
}

.text-offline {
	color: #6b7280;
}

.fault-summary {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 24rpx;
	border-bottom: 1rpx solid #f1f5f9;
	margin-bottom: 24rpx;
}

.fault-summary-label {
	font-size: 26rpx;
	color: #6b7280;
}

.fault-summary-value {
	font-size: 34rpx;
	font-weight: 600;
	color: #111827;
}

.fault-summary-value.has-fault {
	color: #b45309;
}

.fault-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.fault-item {
	padding: 22rpx;
	background-color: #fffbeb;
	border: 1rpx solid #fde68a;
	border-radius: 18rpx;
}

.fault-item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 12rpx;
}

.fault-code {
	font-size: 26rpx;
	color: #92400e;
	font-weight: 600;
}

.fault-time {
	font-size: 24rpx;
	color: #78716c;
	text-align: right;
}

.fault-message {
	font-size: 28rpx;
	color: #1f2937;
	line-height: 1.5;
}

.empty-state {
	padding: 28rpx 16rpx 12rpx;
	text-align: center;
}

.empty-state-title {
	display: block;
	font-size: 28rpx;
	color: #4b5563;
	font-weight: 500;
}

.empty-state-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #9ca3af;
}

.control-head,
.send-position-head,
.map-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 24rpx;
}

.control-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #111827;
}

.control-status,
.map-subtitle {
	font-size: 24rpx;
	color: #6b7280;
	text-align: right;
}

.direction-control {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
}

.direction-row {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16rpx;
}

.direction-btn {
	width: 156rpx;
	height: 84rpx;
	line-height: 84rpx;
	background-color: #334155;
	color: #ffffff;
	border: none;
	border-radius: 16rpx;
	font-size: 28rpx;
	font-weight: 500;
	padding: 0;
}

.direction-btn:not([disabled]):active {
	background-color: #1f2937;
	transform: scale(0.98);
}

.direction-btn[disabled] {
	background-color: #e5e7eb;
	color: #9ca3af;
	opacity: 1;
}

.stop-btn {
	background-color: #475569;
}

.stop-btn:not([disabled]):active {
	background-color: #334155;
}

.position-input-group {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.input-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f1f5f9;
}

.input-item:last-of-type {
	border-bottom: none;
}

.input-label {
	font-size: 28rpx;
	color: #6b7280;
	min-width: 120rpx;
}

.input-field {
	flex: 1;
	height: 80rpx;
	padding: 0 20rpx;
	background-color: #f8fafc;
	border: 1rpx solid #e5e7eb;
	border-radius: 14rpx;
	font-size: 28rpx;
	color: #111827;
}

.input-field[disabled] {
	background-color: #f3f4f6;
	color: #9ca3af;
}

.send-btn {
	height: 80rpx;
	line-height: 80rpx;
	background-color: #334155;
	color: #ffffff;
	border: none;
	border-radius: 16rpx;
	font-size: 30rpx;
	font-weight: 500;
	margin-top: 12rpx;
}

.send-btn:not([disabled]):active {
	background-color: #1f2937;
	transform: scale(0.98);
}

.send-btn[disabled] {
	background-color: #e5e7eb;
	color: #9ca3af;
	opacity: 1;
}

.map-card {
	padding: 28rpx;
}

.map-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #111827;
}

.map-placeholder {
	height: 420rpx;
	border-radius: 20rpx;
	border: 1rpx dashed #cbd5e1;
	background-color: #f8fafc;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24rpx;
	box-sizing: border-box;
	text-align: center;
}

.map-placeholder-title {
	font-size: 30rpx;
	color: #374151;
	font-weight: 500;
}

.map-placeholder-desc {
	margin-top: 14rpx;
	font-size: 26rpx;
	color: #6b7280;
	line-height: 1.5;
}
</style>
