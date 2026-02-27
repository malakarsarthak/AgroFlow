# AgroFlow Mobile Setup Guide (Capacitor)

This guide will help you set up the project locally and convert it into a mobile app using Capacitor for your hackathon presentation.

## 1. Local Development Setup (VS Code)

1. **Clone/Download the Project**:
   Ensure you have all the source files in a folder.

2. **Install Dependencies**:
   Open your terminal in VS Code and run:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the Web App**:
   ```bash
   npm run dev
   ```
   Your app will be available at `http://localhost:3000`.

## 2. Converting to Mobile App (Capacitor)

1. **Install Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli
   ```

2. **Initialize Capacitor**:
   ```bash
   npx cap init AgroFlow com.agroflow.app --web-dir dist
   ```

3. **Build the Project**:
   ```bash
   npm run build
   ```

4. **Add Platforms**:
   - For Android:
     ```bash
     npm install @capacitor/android
     npx cap add android
     ```
   - For iOS:
     ```bash
     npm install @capacitor/ios
     npx cap add ios
     ```

5. **Sync and Open**:
   ```bash
   npx cap sync
   npx cap open android  # Opens in Android Studio
   npx cap open ios      # Opens in Xcode
   ```

## 3. Mobile Features Optimization

- **Voice Assistant**: Uses Web Speech API which is supported in Capacitor's WebView.
- **Firebase**: Ensure your Firebase config allows the `capacitor://localhost` (iOS) and `http://localhost` (Android) origins.
- **Responsive UI**: The app now uses a bottom navigation bar on mobile for a native feel.

## 4. Presentation Tips

- **Live Demo**: Use a screen mirroring tool (like Scrcpy for Android or QuickTime for iPhone) to show the app running on a real device.
- **Voice Commands**: Demonstrate the "AgroFlow Intelligence" by asking "Should I irrigate today?" using the voice button.
- **Power Button**: Show the "Start Pump" button in the dashboard to demonstrate real-time control.
