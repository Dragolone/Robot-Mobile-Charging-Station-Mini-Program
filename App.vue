<script>
	import { ensureLoginForCurrentPage } from '@/utils/auth.js'
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
			// 避免首帧时 getCurrentPages 尚未就绪
			setTimeout(() => {
				ensureLoginForCurrentPage()
			}, 0)
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
