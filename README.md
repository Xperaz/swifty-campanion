# Swifty Companion 
**Swifty Companion** is a mobile app designed for students of the 42 school, acting as a personal digital assistant for the 42 Intra network. It lets users securely log in with their 42 account, view their own detailed profile, and easily search for other students to see their information, skills, and project progress.

## 📱 Features

- 🔑 **OAuth2 Authentication** with the 42 API (no token per request, handled with context & refresh).
- 🔍 **Search students** by login.
- 👤 **Profile view** with:
  - Login, email, phone, wallet, campus location
  - Profile picture
  - Current level
- 📊 **Skills** with level and percentage.
- 📚 **Projects** (completed + failed).
- ⚡ **Error handling**.
- 📐 Responsive UI using **Flexbox**.


## 🛠️ Tech Stack

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/) for OAuth
- [42 API](https://api.intra.42.fr/apidoc)

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

