<template>
	<view class="container">
		<scroll-view scroll-y class="scroll-content">
			<!-- 数据展示区域 -->
			<view class="section">
				<view class="section-title">设备信息</view>
				
				<!-- 电量卡片 -->
				<view class="battery-card">
					<view class="battery-item">
						<text class="battery-label">车体电量</text>
						<text class="battery-value">{{ formatBattery(robotDetail?.vehicleBattery) }}%</text>
					</view>
					<view class="battery-divider"></view>
					<view class="battery-item">
						<text class="battery-label">电池包电量</text>
						<text class="battery-value">{{ formatBattery(robotDetail?.packBattery) }}%</text>
					</view>
				</view>
				
				<!-- 基本信息卡片 -->
				<view class="info-card">
					<view class="info-item">
						<text class="info-label">设备编号</text>
						<text class="info-value">{{ robotDetail?.robotCode || '-' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">型号</text>
						<text class="info-value">{{ robotDetail?.model || '-' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">联网状态</text>
						<text class="info-value" :class="{ online: robotDetail?.online, offline: !robotDetail?.online }">
							{{ robotDetail?.online ? '在线' : '离线' }}
						</text>
					</view>
					<view class="info-item">
						<text class="info-label">位置</text>
						<text class="info-value">
							X: {{ robotDetail?.location?.x || '-' }}, Y: {{ robotDetail?.location?.y || '-' }}
						</text>
					</view>
				</view>
				
				<!-- 模型图片占位 -->
				<view class="model-image-card">
					<view class="model-placeholder">
						<text class="placeholder-text">模型图片</text>
						<text class="placeholder-desc">{{ robotDetail?.model || '-' }}</text>
					</view>
				</view>
				
				<!-- 故障列表 -->
				<view class="fault-card" v-if="robotDetail?.faults && robotDetail.faults.length > 0">
					<view class="fault-header">
						<text class="fault-title">故障列表 ({{ robotDetail.faults.length }})</text>
					</view>
					<view class="fault-list">
						<view 
							v-for="(fault, index) in robotDetail.faults" 
							:key="index" 
							class="fault-item"
						>
							<view class="fault-code">{{ fault.code }}</view>
							<view class="fault-message">{{ fault.message }}</view>
							<view class="fault-time">{{ fault.time }}</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 控制区域 -->
			<view class="section">
				<view class="section-title">设备控制</view>
				
				<!-- 方向控制 -->
				<view class="control-card">
					<view class="control-title">方向控制</view>
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
				
				<!-- 发送点位 -->
				<view class="control-card">
					<view class="control-title">发送点位</view>
					<view class="position-input-group">
						<view class="input-item">
							<text class="input-label">X坐标：</text>
							<input 
								class="input-field" 
								type="digit" 
								v-model="positionX" 
								placeholder="请输入X坐标"
								:disabled="!robotDetail?.online"
							/>
						</view>
						<view class="input-item">
							<text class="input-label">Y坐标：</text>
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
				
				<!-- 地图展示占位 -->
				<view class="map-card">
					<view class="map-placeholder">
						<text class="placeholder-text">地图展示</text>
						<text class="placeholder-desc">当前位置：X {{ robotDetail?.location?.x || '-' }}, Y {{ robotDetail?.location?.y || '-' }}</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatBattery } from '@/utils/format.js'
import { callRobotService } from '@/services/robotService.js'

const robotCode = ref('')
const robotDetail = ref(null)
const positionX = ref('')
const positionY = ref('')

onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = currentPage.options || {}
	robotCode.value = options.robotCode || ''
	
	if (robotCode.value) {
		loadRobotDetail()
	}
})

async function loadRobotDetail() {
	const data = await callRobotService({ action: 'robotDetail', robotCode: robotCode.value })
	if (!data) return

	const robot = data.robot || {}
	const telemetry = data.telemetry || {}

	// 页面模板期望 robotDetail 直接包含电量/lastSeen/faults/location 等字段
	robotDetail.value = {
		...robot,
		vehicleBattery: telemetry.vehicleBattery,
		packBattery: telemetry.packBattery,
		lastSeen: telemetry.lastSeen,
		faults: data.faults || []
	}
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
	background-color: #f5f5f5;
}

.scroll-content {
	height: 100%;
}

.section {
	padding: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
	margin-bottom: 20rpx;
}

/* 电量卡片 */
.battery-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	justify-content: space-around;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.battery-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.battery-divider {
	width: 1rpx;
	height: 80rpx;
	background-color: #e0e0e0;
}

.battery-label {
	font-size: 26rpx;
	color: #666666;
	margin-bottom: 12rpx;
}

.battery-value {
	font-size: 48rpx;
	font-weight: 600;
	color: #2196f3;
	font-family: 'Courier New', monospace;
	letter-spacing: 2rpx;
}

/* 信息卡片 */
.info-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 28rpx;
	color: #666666;
}

.info-value {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
}

.info-value.online {
	color: #4caf50;
}

.info-value.offline {
	color: #f44336;
}

/* 模型图片占位 */
.model-image-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.model-placeholder {
	height: 400rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.placeholder-text {
	font-size: 32rpx;
	color: #666666;
	margin-bottom: 12rpx;
}

.placeholder-desc {
	font-size: 26rpx;
	color: #999999;
}

/* 故障卡片 */
.fault-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.fault-header {
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.fault-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #f44336;
}

.fault-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.fault-item {
	padding: 20rpx;
	background-color: #fff3e0;
	border-radius: 12rpx;
	border-left: 4rpx solid #ff9800;
}

.fault-code {
	font-size: 24rpx;
	color: #ff9800;
	font-weight: 600;
	margin-bottom: 8rpx;
}

.fault-message {
	font-size: 28rpx;
	color: #333333;
	margin-bottom: 8rpx;
}

.fault-time {
	font-size: 24rpx;
	color: #999999;
}

/* 控制卡片 */
.control-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.control-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333333;
	margin-bottom: 24rpx;
}

/* 方向控制 */
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
	width: 140rpx;
	height: 80rpx;
	line-height: 80rpx;
	background-color: #2196f3;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	padding: 0;
}

.direction-btn:not([disabled]):active {
	background-color: #1976d2;
	transform: scale(0.95);
}

.direction-btn[disabled] {
	background-color: #e0e0e0;
	color: #999999;
	opacity: 0.6;
}

.stop-btn {
	background-color: #f44336;
}

.stop-btn:not([disabled]):active {
	background-color: #d32f2f;
}

/* 发送点位 */
.position-input-group {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.input-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.input-label {
	font-size: 28rpx;
	color: #666666;
	min-width: 120rpx;
}

.input-field {
	flex: 1;
	height: 80rpx;
	padding: 0 20rpx;
	background-color: #f5f5f5;
	border-radius: 8rpx;
	font-size: 28rpx;
	color: #333333;
}

.input-field[disabled] {
	background-color: #e0e0e0;
	color: #999999;
}

.send-btn {
	height: 80rpx;
	line-height: 80rpx;
	background-color: #4caf50;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	font-size: 30rpx;
	font-weight: 500;
	margin-top: 10rpx;
}

.send-btn:not([disabled]):active {
	background-color: #388e3c;
	transform: scale(0.98);
}

.send-btn[disabled] {
	background-color: #e0e0e0;
	color: #999999;
	opacity: 0.6;
}

/* 地图占位 */
.map-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.map-placeholder {
	height: 500rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%);
}
</style>
