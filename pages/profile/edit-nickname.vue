<template>
	<view class="page">
		<view class="card">
			<view class="section-title">修改昵称</view>

			<view class="field">
				<input
					class="input"
					:value="nicknameDraft"
					:focus="true"
					maxlength="20"
					confirm-type="done"
					placeholder="请输入昵称（1~20）"
					placeholder-class="input-placeholder"
					@input="onNicknameInput"
					@confirm="save"
				/>
				<view class="helper">
					<text class="helper-text">{{ helperText }}</text>
				</view>
			</view>
		</view>

		<view class="action-area">
			<button
				class="save-button pressable-button"
				:disabled="saving"
				hover-class="pressable-button-hover"
				@tap="save"
			>
				{{ saving ? '保存中…' : '保存' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { isLoggedIn } from '@/utils/auth.js'

const userService = uniCloud.importObject('userService', {
	customUI: true,
	errorOptions: { type: 'none' }
})

const nicknameDraft = ref('')
const saving = ref(false)

const helperText = computed(() => {
	const len = String(nicknameDraft.value || '').trim().length
	return `${len}/20`
})

onLoad(async (options) => {
	if (!isLoggedIn()) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}

	const fromParam = options?.nickname ? decodeURIComponent(String(options.nickname)) : ''
	if (fromParam) {
		nicknameDraft.value = String(fromParam).trim()
		return
	}

	// 参数缺失时兜底拉一次（简单稳妥）
	try {
		const data = await userService.getMyProfile()
		nicknameDraft.value = String(data?.nickname || '').trim()
	} catch (e) {
		console.error('[edit-nickname] getMyProfile failed:', e)
		uni.showToast({ title: '获取昵称失败', icon: 'none' })
	}
})

function onNicknameInput(e) {
	nicknameDraft.value = String(e?.detail?.value ?? '')
}

async function save() {
	if (saving.value) return
	if (!isLoggedIn()) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}

	const nickname = String(nicknameDraft.value || '').trim()
	if (!nickname) {
		uni.showToast({ title: '昵称不能为空', icon: 'none' })
		return
	}
	if (nickname.length < 1 || nickname.length > 20) {
		uni.showToast({ title: '昵称长度需为 1~20', icon: 'none' })
		return
	}

	saving.value = true
	try {
		await userService.updateMyProfile({ nickname })
		uni.$emit('profile:updated', { nickname })
		uni.showToast({ title: '保存成功', icon: 'success' })
		setTimeout(() => {
			uni.navigateBack()
		}, 350)
	} catch (e) {
		console.error('[edit-nickname] updateMyProfile failed:', e)
		uni.showToast({ title: e?.errMsg || e?.message || '保存失败', icon: 'none' })
	} finally {
		saving.value = false
	}
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

.card {
	margin-top: 18rpx;
	padding: 8rpx 0 18rpx;
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

.field {
	padding: 18rpx 24rpx 8rpx;
}

.input {
	height: 88rpx; /* 约 44px */
	padding: 0 20rpx;
	border-radius: 16rpx;
	background: #f3f4f6;
	font-size: 28rpx;
	color: #111827;
}

.input-placeholder {
	color: #9ca3af;
}

.helper {
	margin-top: 10rpx;
	display: flex;
	justify-content: flex-end;
}

.helper-text {
	font-size: 24rpx;
	color: #9ca3af;
}

.action-area {
	margin-top: 18rpx;
}

.save-button {
	width: 100%;
	height: 88rpx; /* 约 44px */
	line-height: 88rpx;
	border-radius: 22rpx; /* 约 11px */
	background: #5b8ff9; /* 柔和蓝 */
	color: #ffffff;
	font-size: 30rpx;
	font-weight: 600;
	box-shadow: 0 10rpx 20rpx rgba(91, 143, 249, 0.18);
}

.save-button[disabled] {
	opacity: 0.55;
}
</style>

