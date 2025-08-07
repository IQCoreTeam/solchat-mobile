import 'dotenv/config';

export default {
  expo: {
    name: "SolChat",
    slug: "solchat-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/solface.jpg",
    scheme: "templateexpobasic",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.iqlabs.solchatmobile",
      adaptiveIcon: {
        foregroundImage: "./assets/images/solface.jpg",
        backgroundColor: "#000000"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#000000",
          dark: {
            backgroundColor: "#000000",
            image: "./assets/images/mainlogo.png"
          },
          image: "./assets/images/mainlogo.png",
          imageWidth: 200,
          resizeMode: "contain"
        }
      ],
      "expo-web-browser",
      "expo-font"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      RPC_URL: process.env.REACT_APP_RPC_URL,
      IQ_BACKEND_HOST: process.env.IQ_BACKEND_HOST
    }
  }
};
