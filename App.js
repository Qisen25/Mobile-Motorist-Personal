import 'react-native-gesture-handler';

import React, { useReducer, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./src/screens/LoginScreen";
//import LoginScreen from "./src/screens/LoginScreen";
import HomeNavigator from "./src/screens/HomeNavigator";
//import AuthenticationContext from "./src/contexts/AuthenticationContext";
import * as GoogleSignIn from "expo-google-sign-in";
import AuthenticationContext from "./src/contexts/AuthenticationContext";
import ws from "./src/utils/ReusableWebSocket";
import Constant from "./src/utils/Constant";

const Stack = createStackNavigator();

export default function App() {
  const [state, dispatch] = useReducer((prevState, action) => {
    switch (action.type) {
      case "LOGIN":
        return {
          ...prevState,
          user: action.user,
          platform: action.platform
        };
      case "LOGOUT":
        return {
          ...prevState,
          user: null,
          platform: null
        };
    }
  }, {
    user: null
  });

  // To be passed to the various login buttons.
  const actions = useMemo(() => ({
    login(platform, token) {
      ws.setHeaders({ headers: { authorisation: token } });
      console.log("oo");
      ws.connect();

     // On message websocket connects then able to retrieve profile info
     // Im not expert with react native, soz if this is not convention but it works
      ws.ws.addEventListener("message", function(message) {
        let data = JSON.parse(message.data);

        if (data.type === "profile") {
          dispatch({
            type: "LOGIN",
            user: {
              id: data.id,
              email: data.email,
              firstName: data.fname,
              lastName: data.lname,
              photoURL: data.photo
            },
            // user: {
            //   id: "0",
            //   email: "damonezard@gmail.com",
            //   firstName: "Damon",
            //   lastName: "Ezard",
            //   photoURL: "https://picsum.photos/200"
            // },
            platform
          });
        }
      });

      ws.ws.onopen = event => {
        ws.send({ type: "profile"});
      }
    },
    async logout(platform) {
      if (platform === Constant.Platform.GOOGLE) {
        await GoogleSignIn.signOutAsync();
      }

      ws.close();

      dispatch({ type: "LOGOUT" });
    }
  }), []);

  return (
    <AuthenticationContext.Provider value={{ actions, state }}>
      <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>    
          { state.user === null ?
            <Stack.Screen name="Login" component={LoginScreen} />
            // <Stack.Screen name="LoginScreen" component={LoginScreen}/>
            :
            <Stack.Screen name="Home" component={HomeNavigator} />
          }
        </Stack.Navigator>
      </NavigationContainer>
    </AuthenticationContext.Provider>
  );
}