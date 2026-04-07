# Ayurzenix Native Android App

This is a fully native Android application built using Kotlin and XML, following the MVVM architecture.

## Features
- **AI Chat**: Powered by Gemini API for personalized Ayurvedic consultations.
- **Authentication**: Firebase Phone OTP login.
- **Wallet System**: Razorpay integration for recharging and managing credits.
- **Consultation Flow**: 2 free uses per user, then ₹10 per consultation.
- **Amazon Integration**: Dynamic affiliate links for recommended medicines.
- **Material Design 3**: Modern, clean UI with smooth animations.

## Prerequisites
- Android Studio (Hedgehog or newer recommended)
- Firebase Project with Phone Auth and Firestore enabled
- Gemini API Key from Google AI Studio
- Razorpay API Key

## Setup Instructions

1. **Firebase Configuration**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Add an Android app with package name `in.ayurzenix.app`.
   - Download `google-services.json` and place it in the `app/` directory.
   - Enable **Phone Authentication** in the Firebase Auth settings.
   - Enable **Cloud Firestore** and set your rules.

2. **API Keys**:
   - Open `app/src/main/java/in/ayurzenix/app/viewmodel/ChatViewModel.kt` and replace `YOUR_GEMINI_API_KEY` with your actual key.
   - Open `app/src/main/AndroidManifest.xml` and replace `YOUR_RAZORPAY_KEY` with your Razorpay key.

3. **Open in Android Studio**:
   - Open Android Studio.
   - Select **Open** and navigate to the `android-native` folder.
   - Wait for Gradle to sync.

4. **Run the App**:
   - Connect an Android device or start an emulator.
   - Click the **Run** button (green play icon).

## Architecture
- **MVVM**: Separation of concerns between UI, Business Logic, and Data.
- **Retrofit**: For any future REST API integrations.
- **ViewBinding**: For safe and efficient view access.
- **Coroutines**: For asynchronous tasks (AI calls, Firestore).

## Project Structure
- `ui/`: Activities and Fragments.
- `viewmodel/`: Logic for each screen.
- `model/`: Data classes.
- `adapter/`: RecyclerView adapters for Chat and Transactions.
- `res/layout/`: XML UI designs.
