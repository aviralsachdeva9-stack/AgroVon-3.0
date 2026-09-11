<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<h1 align="center">🌾 AgroVON 3.0</h1>
<p align="center"><strong>Advanced Edge AI & IoT Smart Agriculture Platform</strong></p>

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue)
![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-A22846?style=for-the-badge&logo=Raspberry%20Pi&logoColor=white)

</div>

## 📖 Overview
AgroVON is a cutting-edge, offline-first smart agriculture platform designed to empower farmers with real-time field data, AI-driven crop disease detection, and autonomous disaster alerts. Built for edge environments with poor internet connectivity, AgroVON relies on a localized Raspberry Pi Edge Node and ESP32-CAM hardware architecture.

## ✨ Features
- **🚨 Real-Time Disaster Alerts**: Immediate visual warnings for severe weather or critical field conditions based on local sensor data.
- **📡 Live Hardware Telemetry**: Unified dashboard displaying Temperature, Moisture, and Rain values polled directly from physical sensor nodes every 2 seconds.
- **📸 Edge AI Disease Detection**: Real-time YOLOv8 video feed running directly on the Raspberry Pi with bounding boxes drawn over detected crop diseases.
- **📸 ESP32-CAM Live View**: Pseudo-live streaming capability pulling raw frames from connected ESP32-CAM modules.
- **📊 Local Sensor History**: Charts powered by an offline SQLite database hosted on the Edge Node.
- **🌐 Offline-First Architecture**: Minimal reliance on cloud services. Backend API and AI Inference run locally on a Raspberry Pi 5.
- **💬 Multilingual Support**: Accessible interface localized for farmers.

## 🛠️ Tech Stack
### Frontend (Web/Mobile View)
- React (Vite)
- TypeScript
- Tailwind CSS
- Lucide Icons (UI Elements)
- Chart.js / Recharts (Data Visualization)

### Hardware & Backend (Edge AI)
- **Edge Server**: Raspberry Pi 5
- **Backend API**: Python (Flask)
- **Database**: SQLite (Local history logging)
- **Sensors**: ESP32 / ESP32-CAM / Soil Sensors
- **AI Model**: YOLOv8 (Computer Vision)

## 🏗️ Hardware Architecture
The system operates on a localized sub-network (e.g., `192.168.137.x`):
1. **Master Node (Raspberry Pi 5)**: Runs the Flask API at `http://<PI_IP>:5000`. Acts as the local hub for all sensor data, stores history in SQLite, and serves the YOLOv8 MJPEG video feed.
2. **Vision Node (ESP32-CAM)**: Captures images of crops and streams them to the dashboard or Pi.
3. **Sensor Nodes**: Collect temperature, moisture, and rain data, sending telemetry to the Pi.

## 🚀 Setup & Installation (Frontend)

### Prerequisites
- Node.js (v16+)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/aviralsachdeva9-stack/AgroVon-3.0.git
cd agrovon-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add any required API keys:
```env
# Optional external keys for Weather/Mandi data
VITE_WEATHER_API_KEY=your_key_here
```
*(Note: Hardware IP addresses are configured within the components for the edge-network environment, e.g., `192.168.137.56`)*

### 4. Run the Development Server
```bash
npm run dev
```

## 🔌 API Endpoints (Raspberry Pi)
The frontend expects the following local endpoints from the Raspberry Pi:
- `GET /api/farm-status` - Returns `{ status, temp/temperature, moist/moisture, rain/rain_val }`
- `GET /video_feed` - MJPEG video stream with YOLOv8 bounding boxes
- `GET /api/history` - Historical SQLite sensor data logs

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---
*Built for the future of farming.* 🚀🌾
