<template>
	<view class="page">
		<view class="card">
			<view class="title">登录</view>
			<view class="sub">账号密码登录（最小可运行版本）</view>

			<view class="form">
				<view class="field">
					<view class="label">账号</view>
					<input
						class="input"
						v-model="username"
						placeholder="手机号 / 用户名 / 邮箱"
						confirm-type="next"
					/>
				</view>

				<view class="field">
					<view class="label">密码</view>
					<input
						class="input"
						password
						v-model="password"
						placeholder="请输入密码"
						confirm-type="done"
						@confirm="submit"
					/>
				</view>

				<button class="btn" type="primary" :disabled="loading" @click="submit">
					{{ loading ? '登录中…' : '登录' }}
				</button>

				<view class="links">
					<text class="link" @click="toRegister">注册账号</text>
					<text class="sep">|</text>
					<text class="link" @click="toUniIdLogin">使用内置登录页</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { backToRedirect, ensureLogin, saveRedirectUrl, setLoginToken } from '@/utils/auth.js'
import { mutations } from '@/uni_modules/uni-id-pages/common/store.js'

const uniIdCo = uniCloud.importObject('uni-id-co', {
	customUI: true,
	errorOptions: { type: 'toast' }
})

const username = ref('')
const password = ref('')
const loading = ref(false)
const redirectUrl = ref('')

onLoad((query = {}) => {
	// 已经登录则直接回跳（避免从 App 启动/拦截误入登录页）
	if (ensureLogin()) return

	const q = String(query.redirectUrl || '').trim()
	if (q) {
		redirectUrl.value = decodeURIComponent(q)
		saveRedirectUrl(redirectUrl.value)
	}
})

function toRegister() {
	uni.navigateTo({
		url: '/uni_modules/uni-id-pages/pages/register/register'
	})
}

function toUniIdLogin() {
	uni.navigateTo({
		url: '/uni_modules/uni-id-pages/pages/login/login-withpwd'
	})
}

async function submit() {
	if (loading.value) return

	const u = String(username.value || '').trim()
	const p = String(password.value || '')
	if (!u) {
		uni.showToast({ title: '请输入账号', icon: 'none' })
		return
	}
	if (!p) {
		uni.showToast({ title: '请输入密码', icon: 'none' })
		return
	}

	const data = { password: p }
	if (/^1\d{10}$/.test(u)) data.mobile = u
	else if (/@/.test(u)) data.email = u
	else data.username = u

	loading.value = true
	try {
		const res = await uniIdCo.login(data)
		// 安全原则：不信任/不使用前端传 uid；客户端只持有 token，由后端解密得到 uid
		setLoginToken(res?.newToken)

		// 触发 uni-id-pages 的用户信息更新（不依赖 uid 参数）
		mutations.loginSuccess({
			showToast: true,
			toastText: '登录成功',
			autoBack: false,
			passwordConfirmed: res?.passwordConfirmed
		})

		// 按 redirectUrl 回跳
		backToRedirect(redirectUrl.value || '/pages/robots/index')
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #f6f7fb;
	padding: 40rpx 24rpx;
	box-sizing: border-box;
	display: flex;
	align-items: flex-start;
	justify-content: center;
}

.card {
	width: 100%;
	max-width: 720rpx;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 34rpx 28rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.06);
}

.title {
	font-size: 40rpx;
	font-weight: 700;
	color: #111827;
}

.sub {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #6b7280;
}

.form {
	margin-top: 28rpx;
}

.field {
	margin-bottom: 22rpx;
}

.label {
	font-size: 26rpx;
	color: #374151;
	margin-bottom: 10rpx;
}

.input {
	height: 84rpx;
	padding: 0 20rpx;
	background: #f3f4f6;
	border-radius: 14rpx;
	font-size: 28rpx;
	color: #111827;
}

.btn {
	margin-top: 10rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 14rpx;
	font-size: 30rpx;
}

.links {
	margin-top: 22rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16rpx;
}

.link {
	font-size: 24rpx;
	color: #2563eb;
}

.sep {
	font-size: 24rpx;
	color: #9ca3af;
}
</style>

