<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">机器人充电站</text>
		</view>
	</view>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
	// 自动跳转到机器人列表页
	setTimeout(() => {
		uni.redirectTo({
			url: '/pages/robots/index'
		})
	}, 500)
})
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
