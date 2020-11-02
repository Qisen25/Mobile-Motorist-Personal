import React from "react";
import { Icon } from "react-native-elements";
import { createStackNavigator } from "@react-navigation/stack";
import OptionScreen from "./OptionScreen";
import ProfileScreen from "./ProfileScreen";
import SettingsScreen from "./SettingsScreen";

const Stack = createStackNavigator();

/**
 * Component for the Home screen, which navigates
 * between the tracking and sccount screens.
 *
 * @component
 */
export default function AccountNavigator() {
  return (
    <Stack.Navigator initialRouteName="Option">
      <Stack.Screen
        options={{ headerTitle: "Account" }}
        name="Option"
        component={OptionScreen}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
