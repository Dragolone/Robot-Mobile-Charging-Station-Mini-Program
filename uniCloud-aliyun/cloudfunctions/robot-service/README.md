## robot-service 云函数接口说明（Phase 3）

### 一、文件清单

- `uniCloud-aliyun/cloudfunctions/robot-service/index.js`  
  - 提供 3 个接口：
    - `action: 'robotList'`
    - `action: 'robotDetail'`
    - `action: 'commandCreate'`

统一返回结构：

```json
// 成功
{ "code": 0, "data": { ... } }

// 失败
{ "code": 1001, "message": "错误信息" }
```

---

### 二、接口定义

#### 1. robotList

**描述**：返回机器人列表，并拼上最新遥测数据和故障数量。

**入参（event）：**

```json
{
  "action": "robotList"
}
```

**返回（data）：**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "robot": { /* robots 集合文档 */ },
        "telemetry": { /* telemetry_latest 文档 或 null */ },
        "faultCount": 3
      }
    ]
  }
}
```

**调试方法（uniCloud 控制台）：**
1. 打开 uniCloud 控制台 → 云函数 → 选择服务空间（阿里云）
2. 找到并点击 `robot-service` 云函数
3. 点击「测试运行」
4. 在「入参」中填写：

```json
{
  "action": "robotList"
}
```

5. 点击「运行」，预期返回 `code: 0`，`data.list` 中至少包含 2 台机器人。

---

#### 2. robotDetail

**描述**：按 `robotCode` 返回机器人详情，包括基础信息、最新遥测和最近 20 条故障。

**入参（event）：**

```json
{
  "action": "robotDetail",
  "robotCode": "ROBOT-001"
}
```

**返回（data）：**

```json
{
  "code": 0,
  "data": {
    "robot": { /* robots 文档 */ },
    "telemetry": { /* telemetry_latest 文档 或 null */ },
    "faults": [ /* 最多 20 条 faults 文档，按 ts 倒序 */ ]
  }
}
```

**错误示例：robotCode 不存在**

```json
{
  "code": 1002,
  "message": "robotCode 不存在"
}
```

**调试方法（uniCloud 控制台）：**
1. 在 `robot-service` 云函数测试界面
2. 入参示例：

```json
{
  "action": "robotDetail",
  "robotCode": "ROBOT-001"
}
```

3. 运行后检查：
   - `code === 0`
   - `data.robot.robotCode === "ROBOT-001"`
   - `data.telemetry.robotCode === "ROBOT-001"`（如果有遥测数据）
   - `data.faults` 为数组，长度 ≤ 20，且 `robotCode` 均为 `"ROBOT-001"`。

---

#### 3. commandCreate

**描述**：创建控制命令写入 `commands` 集合，并进行入参校验和 500ms 节流。

**入参（event）：**

```json
{
  "action": "commandCreate",
  "robotCode": "ROBOT-001",
  "type": "move",          // move / stop / goto
  "payload": {
    "direction": "forward" // 示例：move 命令的方向
  }
}
```

> 说明：  
> - `type = "move"` 时，`payload` 可包含 `direction` 等字段  
> - `type = "stop"` 时，`payload` 通常为空对象 `{}`  
> - `type = "goto"` 时，`payload` 可包含 `x`、`y` 坐标

**成功返回：**

```json
{
  "code": 0,
  "data": {
    "commandId": "xxxxxxxxxx",   // 新创建命令的 _id
    "robotCode": "ROBOT-001",
    "type": "move",
    "status": "pending"
  }
}
```

**错误场景：**

- robotCode 为空：

```json
{ "code": 2001, "message": "robotCode 不能为空" }
```

- type 为空：

```json
{ "code": 2002, "message": "type 不能为空" }
```

- type 非法（非 move/stop/goto）：

```json
{ "code": 2003, "message": "type 非法，只能为 move/stop/goto" }
```

- robotCode 不存在：

```json
{ "code": 2004, "message": "robotCode 不存在" }
```

- 500ms 内同 robotCode + type 重复请求：

```json
{ "code": 2005, "message": "同一机器人 500ms 内重复命令已被拒绝" }
```

**调试方法（uniCloud 控制台）：**

1. 在 `robot-service` 云函数测试界面
2. 第一次调用入参示例：

```json
{
  "action": "commandCreate",
  "robotCode": "ROBOT-001",
  "type": "move",
  "payload": {
    "direction": "forward"
  }
}
```

3. 立即再次调用相同参数，应返回 `code === 2005`
4. 等待 500ms 以上再次调用，应返回 `code === 0` 且生成新的 `commandId`

---

### 三、验收标准

1. **功能验收**
   - `robotList`：
     - 返回 `code === 0`
     - `data.list` 为数组，长度 ≥ 2
     - 每项包含 `robot`、`telemetry`、`faultCount` 字段
   - `robotDetail`：
     - 正确的 `robotCode` 返回 `code === 0`
     - 返回 `robot.robotCode === 请求的 robotCode`
     - `faults` 长度 ≤ 20，按时间倒序
     - 非法或不存在的 `robotCode` 返回非 0 `code` 和 `message`
   - `commandCreate`：
     - 合法参数返回 `code === 0` 且包含 `commandId`
     - 非法参数（缺少 robotCode/type、非法 type、robotCode 不存在）返回非 0 `code`
     - 500ms 内重复命令被拒绝（`code === 2005`）

2. **数据写入验收**
   - 在 `commands` 集合中，能看到新插入的命令记录：
     - `robotCode`、`type`、`payload`、`status: 'pending'`
     - `ts`、`createdAt` 为当前时间戳（毫秒）

3. **稳定性验收**
   - 任意接口异常时，返回：
     - `code !== 0`
     - `message` 为可读的中文错误信息
   - 云函数运行日志中无未捕获异常堆栈输出。

