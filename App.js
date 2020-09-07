import 'react-native-gesture-handler';

import React, { useReducer, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./src/screens/TestLoginScreen";
//import LoginScreen from "./src/screens/LoginScreen";
import MapScreen from "./src/screens/MapScreen";
//import AuthenticationContext from "./src/contexts/AuthenticationContext";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="LoginScreen" component={LoginScreen}/>
        <Stack.Screen name="MapScreen" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}