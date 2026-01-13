/**
 * Mock 数据工具
 * 用于 Phase 1 开发阶段的模拟数据
 */

/**
 * 生成机器人列表 Mock 数据
 */
export function getRobotList() {
	return [
		{
			robotCode: 'ROBOT-001',
			model: 'AGV-2000',
			online: true,
			vehicleBattery: 85.5,
			packBattery: 92.3,
			lastSeen: '2024-01-15 14:30:25',
			faultCount: 0,
			location: { x: 120.5, y: 30.2 },
			faults: []
		},
		{
			robotCode: 'ROBOT-002',
			model: 'AGV-2000',
			online: true,
			vehicleBattery: 65.8,
			packBattery: 78.9,
			lastSeen: '2024-01-15 14:28:10',
			faultCount: 2,
			location: { x: 120.6, y: 30.3 },
			faults: [
				{ code: 'F001', message: '电池温度异常', time: '2024-01-15 13:20:00' },
				{ code: 'F002', message: '通信延迟', time: '2024-01-15 13:25:00' }
			]
		},
		{
			robotCode: 'ROBOT-003',
			model: 'AGV-3000',
			online: false,
			vehicleBattery: 45.2,
			packBattery: 52.1,
			lastSeen: '2024-01-15 12:15:30',
			faultCount: 1,
			location: { x: 120.4, y: 30.1 },
			faults: [
				{ code: 'F003', message: '设备离线', time: '2024-01-15 12:15:30' }
			]
		},
		{
			robotCode: 'ROBOT-004',
			model: 'AGV-2000',
			online: true,
			vehicleBattery: 95.0,
			packBattery: 98.5,
			lastSeen: '2024-01-15 14:32:00',
			faultCount: 0,
			location: { x: 120.7, y: 30.4 },
			faults: []
		},
		{
			robotCode: 'ROBOT-005',
			model: 'AGV-3000',
			online: true,
			vehicleBattery: 72.3,
			packBattery: 80.6,
			lastSeen: '2024-01-15 14:29:45',
			faultCount: 3,
			location: { x: 120.3, y: 30.0 },
			faults: [
				{ code: 'F001', message: '电池温度异常', time: '2024-01-15 14:00:00' },
				{ code: 'F004', message: '传感器故障', time: '2024-01-15 14:10:00' },
				{ code: 'F002', message: '通信延迟', time: '2024-01-15 14:20:00' }
			]
		}
	]
}

/**
 * 根据 robotCode 获取机器人详情
 */
export function getRobotDetail(robotCode) {
	const list = getRobotList()
	return list.find(robot => robot.robotCode === robotCode) || null
}
