# Rit - Instagram Clone App

A React Native Instagram clone built with Expo and Firebase.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the App](#running-the-app)
- [Firebase Configuration](#firebase-configuration)
- [Additional Notes](#additional-notes)
- [License](#license)

---

## Project Overview

Rit is a social media app inspired by Instagram, built using React Native with Expo SDK 53, and Firebase services for authentication, database, and storage.

---

## Prerequisites

Before running this project, ensure your development environment meets the following requirements:

- **Node.js:** v18.x or higher (tested on v18.20.6)  
  Download: [https://nodejs.org/](https://nodejs.org/)
- **npm:** v9.x or higher (tested on 10.9.2)
- **Expo CLI:** v6.x or higher (tested with npx expo CLI v0.24.20)
- **Android Studio:** Electric Eel (2022.1.1) or newer
   - Android SDK Platform 33+ (Android 13)
   - Android Emulator with x86/x86_64 images
   - Android SDK Build-Tools 33.0.0+

---

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/rit.git
   cd rit
   
2. **Install Dependencies**
    
    ```bash
    npm install
   
3. **Configure Firebase**

    - This project uses Firebase for backend services (cloud functions and database)
    - **IMPORTANT**: The 'android/app/google-services.json' file is **not** include in the repository for security reasons.
    - Please contact me at [jackson.mears2002@gmail.com] to get access to the Firebase configuration file and how to implement it.

4. **Start the development server**
    
    ```bash
   npx expo start
   
---

## Running the App

**On Android Emulator**

1. Open Android Studio.
2. Launch an Android Virtual Device (AVD) with Android 13 or higher.
3. Run the app with:

    ```bash
   npx expo run:android
   
**On Physical Device**

- Connect your Android device via USB with USB debugging enabled. 
- Run the app the same way as emulator

    ```bash
    npx expo run:android
  
---

## Firebase Configuration

- The Firebase backend includes Firestore, Authentication, and Storage.
- The Firestore and Storage rules are configured to restrict unauthorized access and prevent abuse. 
- **DO NOT COMMIT** your 'google-services.json' to the repository. It is listed in .gitignore.

---

## Additional Notes

- This project uses Expo SDK 53. Ensure your global/local Expo CLI version supports this.
- Using npx allows running Expo commands without global install.
- For IOS development, a Mac and Xcode are required. 
- For any questions or Firebase config requests, again contact me at [jackson.mears2002@gmail.com]

---

## License

This project is licensed under the MIT License!
    
