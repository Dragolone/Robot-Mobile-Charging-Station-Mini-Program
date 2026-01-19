<template>
	<view class="container">
		<view class="robot-list">
			<view 
				v-for="robot in robotList" 
				:key="robot.robotCode" 
				class="robot-card"
				@click="goToDetail(robot.robotCode)"
			>
				<view class="card-header">
					<view class="robot-code">{{ robot.robotCode }}</view>
					<view class="status-badge" :class="{ online: robot.online, offline: !robot.online }">
						{{ robot.online ? '在线' : '离线' }}
					</view>
				</view>
				
				<view class="card-body">
					<view class="info-row">
						<text class="label">型号：</text>
						<text class="value">{{ robot.model }}</text>
					</view>
					
					<view class="info-row">
						<text class="label">车体电量：</text>
						<text class="value battery">{{ formatBattery(robot.vehicleBattery) }}%</text>
					</view>
					
					<view class="info-row">
						<text class="label">电池包电量：</text>
						<text class="value battery">{{ formatBattery(robot.packBattery) }}%</text>
					</view>
					
					<view class="info-row">
						<text class="label">最后在线：</text>
						<text class="value">{{ robot.lastSeen }}</text>
					</view>
					
					<view class="info-row">
						<text class="label">故障数量：</text>
						<text class="value fault" :class="{ 'has-fault': robot.faultCount > 0 }">
							{{ robot.faultCount }}
						</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatBattery } from '@/utils/format.js'
import { callRobotService } from '@/services/robotService.js'

const robotList = ref([])

onMounted(() => {
	loadRobotList()
})

async function loadRobotList() {
	const data = await callRobotService({ action: 'robotList' })
	if (!data) return

	// 云函数返回：[{ robot, telemetry, faultCount }]
	// 页面模板期望：robotCode/model/online/vehicleBattery/packBattery/lastSeen/faultCount
	robotList.value = (data.list || []).map(item => {
		const robot = item.robot || {}
		const telemetry = item.telemetry || {}
		return {
			robotCode: robot.robotCode,
			model: robot.model,
			online: robot.online,
			location: robot.location,
			vehicleBattery: telemetry.vehicleBattery,
			packBattery: telemetry.packBattery,
			lastSeen: telemetry.lastSeen,
			faultCount: item.faultCount || 0
		}
	})
}

function goToDetail(robotCode) {
	uni.navigateTo({
		url: `/pages/robots/detail?robotCode=${robotCode}`
	})
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
}

.robot-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.robot-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
	transition: all 0.3s;
}

.robot-card:active {
	transform: scale(0.98);
	box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.12);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.robot-code {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
}

.status-badge {
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	font-weight: 500;
}

.status-badge.online {
	background-color: #e8f5e9;
	color: #4caf50;
}

.status-badge.offline {
	background-color: #ffebee;
	color: #f44336;
}

.card-body {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.info-row {
	display: flex;
	align-items: center;
	font-size: 28rpx;
}

.label {
	color: #666666;
	min-width: 140rpx;
}

.value {
	color: #333333;
	font-weight: 500;
}

.value.battery {
	font-family: 'Courier New', monospace;
	font-weight: 600;
	color: #2196f3;
	letter-spacing: 1rpx;
}

.value.fault {
	font-weight: 600;
	color: #666666;
}

.value.fault.has-fault {
	color: #f44336;
}
</style>
