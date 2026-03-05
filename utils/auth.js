const TOKEN_KEY = 'uni_id_token'
const TOKEN_EXPIRED_KEY = 'uni_id_token_expired'
const REDIRECT_URL_KEY = '__login_redirect_url__'

const PROTECTED_ROUTES = new Set([
	'pages/robots/index',
	'pages/robots/detail'
])

let isRedirecting = false

export function isLoggedIn() {
	const token = String(uni.getStorageSync(TOKEN_KEY) || '').trim()
	if (!token) return false
	const expired = Number(uni.getStorageSync(TOKEN_EXPIRED_KEY) || 0)
	if (expired && expired < Date.now()) return false
	return true
}

export function setLoginToken(newToken) {
	const token = String(newToken?.token || '').trim()
	if (!token) return false
	uni.setStorageSync(TOKEN_KEY, token)
	uni.setStorageSync(TOKEN_EXPIRED_KEY, Number(newToken?.tokenExpired || 0))
	return true
}

export function saveRedirectUrl(url) {
	const v = String(url || '').trim()
	if (!v) return
	uni.setStorageSync(REDIRECT_URL_KEY, v)
}

export function consumeRedirectUrl() {
	const v = String(uni.getStorageSync(REDIRECT_URL_KEY) || '').trim()
	if (v) uni.removeStorageSync(REDIRECT_URL_KEY)
	return v
}

export function getCurrentFullPath() {
	const pages = getCurrentPages()
	const page = pages && pages.length ? pages[pages.length - 1] : null
	if (!page) return ''

	// 新版运行时可用
	const fullPath = page?.$page?.fullPath
	if (typeof fullPath === 'string' && fullPath) {
		return fullPath.startsWith('/') ? fullPath : `/${fullPath}`
	}

	const route = String(page.route || '').trim()
	const options = page.options || {}
	const keys = Object.keys(options)
	const query = keys.length
		? keys
				.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(options[k] ?? ''))}`)
				.join('&')
		: ''
	return route ? `/${route}${query ? `?${query}` : ''}` : ''
}

export function isLoginRoute(route) {
	const r = String(route || '').trim()
	if (!r) return false
	return r === 'pages/login/index' || r.startsWith('uni_modules/uni-id-pages/pages/login/')
}

export function ensureLogin(options = {}) {
	const redirectUrl = String(options.redirectUrl || '').trim()
	if (isLoggedIn()) return true

	const pages = getCurrentPages()
	const page = pages && pages.length ? pages[pages.length - 1] : null
	const route = String(page?.route || '').trim()
	if (isLoginRoute(route)) return false

	const finalRedirectUrl = redirectUrl || getCurrentFullPath() || '/pages/robots/index'
	toLogin(finalRedirectUrl)
	return false
}

export function ensureLoginForCurrentPage() {
	const pages = getCurrentPages()
	const page = pages && pages.length ? pages[pages.length - 1] : null
	const route = String(page?.route || '').trim()
	if (!route) return
	if (isLoginRoute(route)) return
	if (!PROTECTED_ROUTES.has(route)) return
	ensureLogin()
}

export function toLogin(redirectUrl) {
	if (isRedirecting) return
	isRedirecting = true
	setTimeout(() => {
		isRedirecting = false
	}, 1200)

	const url = String(redirectUrl || '').trim() || getCurrentFullPath() || '/pages/robots/index'
	saveRedirectUrl(url)

	uni.navigateTo({
		url: `/pages/login/index?redirectUrl=${encodeURIComponent(url)}`,
		fail: () => {
			// 在部分场景（如栈满/重复跳转）navigateTo 可能失败，兜底用 redirectTo
			uni.redirectTo({
				url: `/pages/login/index?redirectUrl=${encodeURIComponent(url)}`
			})
		}
	})
}

export function backToRedirect(fallbackUrl = '/pages/robots/index') {
	const redirectUrl = consumeRedirectUrl() || String(fallbackUrl || '').trim() || '/pages/robots/index'

	uni.redirectTo({
		url: redirectUrl,
		fail: () => {
			uni.switchTab({
				url: redirectUrl,
				fail: () => {
					uni.reLaunch({ url: redirectUrl })
				}
			})
		}
	})
}

