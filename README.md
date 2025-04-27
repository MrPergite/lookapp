# LookApp 👋

## Get started

Ensure ypu have emulator/real device connected
Visit android/ios dev sites for installation

- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

After Installation of emulator run


1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    for dev -  npx expo start
    for prod -  npx expo start:prod
    for ios - npm run ios:dev - for dev
              npm run ios - for prod
   ```
3. Deployment : 
    ### API : 
        vercel build
        vercel deploy --prebuilt
        vercel --prod

    ### IOS(for Test Flight Deployment) : 
       for build - eas build --profile production --platform ios
       for submit to app store - eas submit --platform ios

    ### for eas update/codepush : 
        eas update --channel production --message "add msg here"
            
In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).
