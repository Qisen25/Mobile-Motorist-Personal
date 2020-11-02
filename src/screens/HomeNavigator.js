import React from "react";
import { Icon } from "react-native-elements";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import MapScreen from "./MapScreen";
import AccountNavigator from "./AccountNavigator";

const Tab = createMaterialBottomTabNavigator();

/**
 * Component for the Home navigator, which navigates
 * between the tracking and account screens.
 *
 * @component
 */
export default function HomeNavigator() {
  return (
    <Tab.Navigator
      shifting
      screenOptions={({ route }) => ({
        // eslint-disable-next-line react/prop-types
        tabBarIcon({ color, size }) {
          let iconName;

          if (route.name === "Map") {
            iconName = "explore";
          } else if (route.name === "Account") {
            iconName = "account-circle";
          }

          return <Icon type="material" name={iconName} color={color} size={size}/>;
        }
      })}
    >
      <Tab.Screen options={{ tabBarColor: "#127bd6" }} name="Map" component={MapScreen} />
      <Tab.Screen options={{ tabBarColor: "purple" }} name="Account" component={AccountNavigator} />
    </Tab.Navigator>
  );
}
