<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">机器人充电站</text>
		</view>
	</view>
</template>

<script>
export default {
  onLoad() {
		const TOKEN_KEY = 'uni_id_token'
		const EXPIRED_KEY = 'uni_id_token_expired'

		const token = String(uni.getStorageSync(TOKEN_KEY) || '').trim()
		const expired = Number(uni.getStorageSync(EXPIRED_KEY) || 0)
		const isLoggedIn = !!token && !!expired && expired > Date.now()

		// 避免部分端 onLoad 里直接跳转异常
		setTimeout(() => {
			if (isLoggedIn) {
				uni.switchTab({ url: '/pages/robots/index' })
			} else {
				uni.redirectTo({ url: '/pages/login/index' })
			}
		}, 0)
  }
}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>
