const envConfig = require("./config/env.js");

const appConfig = {
  expo: {
    name: "lookapp",
    slug: "lookapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    runtimeVersion: "0.0.1",
    owner: "egustav2027",
    ios: {
      supportsTablet: true,
      // bundleIdentifier: "com.lookai.lookapp"
      "bundleIdentifier": "com.egustav2027.lookapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "expo-router",
        {
          "origin": "https://egustav2027-lookapp.expo.app"
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "4bd5f21a-069b-40e1-afe8-facc7d4fe0a4",
      },
      enableCors: true,
      origin: "https://egustav2027-lookapp.expo.app",
      ...envConfig,
    },
    
    updates: {
      url: "https://u.expo.dev/4bd5f21a-069b-40e1-afe8-facc7d4fe0a4",
    },
  },
};

export default appConfig;
