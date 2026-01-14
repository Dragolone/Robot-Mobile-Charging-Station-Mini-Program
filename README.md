# 🤖 Robot Charging Station Mini Program

> A robot charging and status management **WeChat Mini Program** built with  
> **uni-app + Vue 3 + uniCloud (Alibaba Cloud)**.
>
> The system supports robot status monitoring, telemetry inspection, fault management,
> and remote control command dispatch.
>
> The project follows a **platform-first, device-later** architecture, enabling seamless
> integration with real robots in the future (4G / HTTP / MQTT).
> integration with real robots in the future (**4G / HTTP / MQTT**).
---

## 📌 Project Background

This project aims to build a **remote management platform for real-world robots**
using a WeChat Mini Program.

### Core Capabilities

- Display robot operational status and battery information
- View telemetry data and fault records
- Dispatch remote control commands to robots

Since the physical robot hardware is not yet finalized, the project prioritizes:

- Overall platform architecture design
- Backend service APIs and database modeling
- Strict frontend–backend decoupling via standardized interfaces

This ensures that **real robot integration can be completed later without refactoring
the existing system**.

---

## 🧱 Tech Stack

### Frontend
- uni-app
- Vue 3
- WeChat Mini Program

### Backend / Cloud Services
- uniCloud (Alibaba Cloud)
- Cloud Functions (Node.js)
- Cloud Database (JQL)

---

## 🗂️ Project Structure (Core)

```text
├── uniCloud-aliyun/
│   ├── cloudfunctions/
│   │   └── robot-service/        # Phase 3 core cloud function
│   │       ├── index.js
│   │       ├── README.md
│   │       └── robot-service.param.json
│   └── database/
│       ├── robots
│       ├── telemetry_latest
│       ├── faults
│       └── commands
````

---

## 🚀 Development Phases

### Phase 1: Project Skeleton & UI Structure

* Initialized uni-app + WeChat Mini Program project
* Built core page structure (robot list, detail, control sections)
* Defined core functional requirements and data presentation layout

---

### Phase 2: Cloud Database Design & Initialization ✅

**Goal:** Build a stable and extensible data model.

Completed work:

* Designed and created four core collections:

  * `robots`: robot base information
  * `telemetry_latest`: latest telemetry per robot
  * `faults`: fault records
  * `commands`: control command records
* Added necessary indexes (including unique and composite indexes)
* Inserted initial mock data
* Verified data queries and relationships using JQL

> Phase 2 ensures the data model is production-ready before real robot integration.

---

### Phase 3: Backend Service Layer (Cloud Functions) ✅

Phase 3 is a **key milestone** of this project.

#### 🎯 Objectives

* Establish a stable business service layer between frontend and database
* Encapsulate all database access logic
* Implement parameter validation, error handling, and safety constraints
* Define a unified API contract for future real robot integration

---

## 🧩 `robot-service` Cloud Function

A single cloud function provides all backend APIs,
dispatched via the `action` parameter.

### 1️⃣ `robotList`

**Purpose:** Retrieve robot list with latest telemetry and fault count.

```json
{
  "action": "robotList"
}
```

**Returns:**

* Robot base information
* Latest telemetry data
* Fault count statistics

---

### 2️⃣ `robotDetail`

**Purpose:** Retrieve detailed information for a single robot.

```json
{
  "action": "robotDetail",
  "robotCode": "ROBOT-001"
}
```

**Returns:**

* Robot base information
* Latest telemetry data
* Most recent fault records (latest 20, ordered by time)

**Error Handling:**

* Explicit error response if `robotCode` does not exist

---

### 3️⃣ `commandCreate`

**Purpose:** Create and dispatch a control command.

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

**Features:**

* Parameter validation
* Robot existence verification
* **500ms command throttling** to prevent command flooding
* Writes to `commands` collection with initial status `pending`

---

### ✅ Phase 3 Acceptance Summary

* Backend APIs execute successfully in uniCloud
* Unified response structure: `{ code, data | message }`
* Parameter validation and error handling verified
* Command throttling works as expected
* No uncaught runtime errors in cloud function logs

> **Phase 3 is fully validated and ready for real robot integration.**

---

## 🧠 Architecture Overview

The system adopts a **decoupled, layered architecture**:

```text
WeChat Mini Program (Frontend)
        ↓
Phase 3 Cloud Functions (robot-service)
        ↓
Cloud Database (robots / telemetry / faults / commands)
        ↑
Future Real Robots (4G / HTTP / MQTT)
```

### Design Advantages

* Frontend is completely decoupled from device implementation
* Robot communication protocols can be replaced or extended
* Backend APIs serve as a stable contract
* Architecture aligns with real-world industrial control systems

---

## 🔮 Future Plans

* **Phase 4**: Frontend integration with cloud APIs
* **Phase 5**: Real robot connectivity (4G / HTTP / MQTT)
* Web-based admin management platform
* Authentication and permission system

---

## ✍️ Notes

This project completes platform and backend design **before hardware availability**.
When real robots are ready, only the device data upload and command execution logic
<<<<<<< HEAD
needs to be implemented—no system redesign required.
=======
needs to be implemented — **no system redesign required**.
>>>>>>> 7dcc327 (beautify the md)
