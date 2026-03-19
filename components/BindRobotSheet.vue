<template>
	<view v-if="visible" class="sheet-layer">
		<view class="sheet-mask" @tap="closeSheet"></view>
		<view class="sheet-panel" @tap.stop>
			<view class="sheet-handle"></view>
			<view class="sheet-title">绑定机器人</view>

			<view class="sheet-option pressable-surface" hover-class="pressable-surface-hover" @tap="handleManualBindTap">
				<text class="sheet-option-title">手动输入设备编号</text>
				<text class="sheet-option-desc">输入 robotCode 完成绑定</text>
			</view>

			<view class="sheet-option pressable-surface" hover-class="pressable-surface-hover" @tap="handleScanBindTap">
				<text class="sheet-option-title">扫码绑定机器人</text>
				<text class="sheet-option-desc">扫描机器人二维码快速完成绑定</text>
			</view>

			<view class="sheet-cancel pressable-surface" hover-class="pressable-surface-hover" @tap="closeSheet">取消</view>
		</view>
	</view>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue'
import { parseRobotBindPayload } from '@/utils/robotBind.js'
import { callRobotService } from '@/services/robotService.js'
import { isLoggedIn } from '@/utils/auth.js'

defineProps({
	visible: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['close', 'success'])

const TOKEN_KEY = 'uni_id_token'

function closeSheet() {
	emit('close')
}

function handleManualBindTap() {
	closeSheet()
	openManualBindDialog()
}

async function handleScanBindTap() {
	closeSheet()
	if (!isLoggedIn()) {
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}

	try {
		const scanResult = await scanRobotCode()
		if (!scanResult) return

		const parsed = parseRobotBindPayload(scanResult)
		if (!parsed.ok) {
			uni.showToast({ title: '无效的机器人二维码', icon: 'none' })
			return
		}

		await bindRobotByCode(parsed.robotCode, 'qrcode', '扫码绑定成功')
	} catch (e) {
		const errMsg = String(e?.errMsg || e?.message || '')
		if (isScanCanceled(errMsg)) return
		if (isScanDecodeFailed(errMsg)) {
			console.error('[bind-sheet] scan decode failed:', e)
			uni.showToast({ title: '二维码识别失败，请重试', icon: 'none' })
			return
		}
		console.error('[bind-sheet] scan bind failed:', e)
		uni.showToast({ title: '扫码失败，请重试', icon: 'none' })
	}
}

async function openManualBindDialog() {
	if (!isLoggedIn()) {
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}

	uni.showModal({
		title: '手动输入设备编号',
		content: '请输入 robotCode',
		editable: true,
		placeholderText: 'ROBOT-001',
		success: async (res) => {
			if (!res.confirm) return
			const robotCode = String(res.content || 'ROBOT-001').trim() || 'ROBOT-001'
			try {
				await bindRobotByCode(robotCode, 'manual', '绑定成功')
			} catch (e) {
				uni.showToast({ title: e?.errMsg || e?.message || '绑定失败', icon: 'none' })
			}
		}
	})
}

async function bindRobotByCode(robotCode, bindSource = 'manual', successTitle = '绑定成功') {
	const result = await callRobotService({
		action: 'bindRobotByCode',
		robotCode,
		bindSource,
		uniIdToken: uni.getStorageSync(TOKEN_KEY)
	})
	if (!result) return null

	const payload = {
		robotCode: result.robotCode || String(robotCode || '').trim(),
		bindSource,
		ts: Date.now()
	}
	uni.$emit('robot:bound', payload)
	emit('success', payload)
	uni.showToast({ title: successTitle, icon: 'success' })
	return result
}

async function scanRobotCode() {
	return new Promise((resolve, reject) => {
		uni.scanCode({
			onlyFromCamera: true,
			scanType: ['qrCode'],
			success: (res) => {
				resolve(String(res?.result || '').trim())
			},
			fail: reject
		})
	})
}

function isScanCanceled(errMsg) {
	return String(errMsg || '').includes('cancel')
}

function isScanDecodeFailed(errMsg) {
	const text = String(errMsg || '').toLowerCase()
	return text.includes('failed to decode qr code') || text.includes('decode qr code')
}
</script>

<style scoped>
@import '@/styles/pressable.css';
.sheet-layer {
	position: fixed;
	inset: 0;
	z-index: 99;
}

.sheet-mask {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.38);
	animation: fade-in 0.18s ease;
}

.sheet-panel {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 12rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
	border-radius: 28rpx 28rpx 0 0;
	background: #f6f7fb;
	box-shadow: 0 -12rpx 36rpx rgba(0, 0, 0, 0.12);
	animation: slide-up 0.22s ease;
}

.sheet-handle {
	width: 72rpx;
	height: 8rpx;
	margin: 8rpx auto 18rpx;
	border-radius: 999rpx;
	background: rgba(107, 114, 128, 0.25);
}

.sheet-title {
	padding: 0 8rpx 18rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: #111827;
	text-align: center;
}

.sheet-option {
	padding: 24rpx;
	border-radius: 20rpx;
	background: #ffffff;
}

.sheet-option + .sheet-option {
	margin-top: 16rpx;
}

.sheet-option-title {
	display: block;
	font-size: 30rpx;
	color: #111827;
}

.sheet-option-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #6b7280;
}

.sheet-cancel {
	margin-top: 18rpx;
	padding: 24rpx;
	border-radius: 20rpx;
	background: #ffffff;
	font-size: 30rpx;
	color: #111827;
	text-align: center;
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slide-up {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}
</style>
