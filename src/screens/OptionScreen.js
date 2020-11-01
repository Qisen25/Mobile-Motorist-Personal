import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Linking, StyleSheet, View } from "react-native";
import { ListItem, Icon } from "react-native-elements";
import AuthenticationContext from "../contexts/AuthenticationContext";

/**
 * Component for the account screen.
 *
 * @component
 */
export default function OptionScreen({ navigation }) {
  const auth = useContext(AuthenticationContext);

  const list = [
    {
      title: "Profile",
      icon: "face",
      onPress() {
        navigation.navigate("Profile");
      }
    },
    {
      title: "Settings",
      icon: "settings",
      onPress() {
        navigation.navigate("Settings")
      }
    },
    {
      title: "About",
      icon: "info",
      onPress() {
        Linking.openURL("https://expektus.io/about");
      }
    },
    {
      title: "Help",
      icon: "help",
      onPress() {
        Linking.openURL("https://expektus.io/help");
      }
    },
    {
      title: "Logout",
      icon: "exit-to-app",
      onPress() {
        auth.actions.logout(auth.state.platform);
      }
    }
  ];

  return (
    <View style={styles.container}>
      {
        list.map((item, i) => (
          <ListItem key={i} bottomDivider onPress={item.onPress}>
            <Icon type="material" name={item.icon} />
            <ListItem.Content>
              <ListItem.Title>{item.title}</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron color="black" />
          </ListItem>
        ))
      }
    </View>
  );
}

OptionScreen.propTypes = {
  navigation: PropTypes.object.isRequired
};

const styles = StyleSheet.create({
  container: {

  }
});
