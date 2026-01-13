/**
 * 格式化工具函数
 */

/**
 * 格式化电量，保留1位小数
 */
export function formatBattery(value) {
	if (value === null || value === undefined) return '0.0'
	return Number(value).toFixed(1)
}

/**
 * 格式化时间显示
 */
export function formatTime(timeStr) {
	if (!timeStr) return '-'
	return timeStr
}
