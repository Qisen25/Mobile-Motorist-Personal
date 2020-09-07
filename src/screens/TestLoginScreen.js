import React, { useContext } from "react";
import { StyleSheet, View, Image, Button } from "react-native";
import { SocialIcon } from "react-native-elements";
import ws from "../utils/ReusableWebSocket";

const TEST_AUTHENTICATION = "testMotor";

/**
 * Component for the login screen.
 *
 * @component
 */
export default function LoginScreen({navigation}) {

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require("../../assets/expektus-logo.png")} />
      </View>
      <View style={styles.buttonsContainer}>
        <Button
          title="TEST SIGN IN"
          onPress={() => {
            // Start the Web Socket Connection
            ws.setHeaders({ headers: { authorisation: TEST_AUTHENTICATION } });
            ws.connect();

            navigation.navigate("MapScreen")
          }}
        />
        <SocialIcon
          button
          type="windows"
          title="Sign In With Microsoft"
          style={styles.microsoft}
        />
        <SocialIcon
          button
          type="facebook"
          title="Sign In With Facebook"
          style={styles.facebook}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: 10
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: "50%"
  },
  logo: {
    width: "75%",
    resizeMode: "contain"
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  google: {
    width: "90%"
  },
  microsoft: {
    backgroundColor: "#127bd6",
    width: "90%"
  },
  facebook: {
    width: "90%"
  }
});