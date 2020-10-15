# Motorist app

The aim of this application is to help provide users (specifically motorists) by encouraging awareness and mindfulness of cyclists in surroundings. The application will retrieve telemetry of cyclists from the web services. The telemetry will be used to determine potential hazards and alert the user.

# How to run

1. Install Android Studio
2. Install node.js
3. Run `npm install` in the project root
4. Open Android Studio
5. Go to Device Manager and create an emulator (Tested on Google Pixel 3a, Android 10)
6. Run the emulator
7. Run `npm run android` in the project root

# Changelog

1. (15/10/2020) - Fixed the heading (direction) inconsistency and jumps, seems to be stable now.
2. (15/10/2020) - Added the google sign in stuff from cyc app, to allow more ppl to test (Clash of telemetry will occur if > 1 ppl use testMotor)
3. (15/10/2020) - Can do limited/fixed zoom in/out now, `double tap screen to zoom out` and `long press to zoom in`. Might be helpful when observing/testing routing functionality.
