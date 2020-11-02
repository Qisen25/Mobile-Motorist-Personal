import React, { useContext } from "react";
import { StyleSheet, View, Image } from "react-native";
import { SocialIcon } from "react-native-elements";
import AuthenticationContext from "../contexts/AuthenticationContext";
import GoogleSignInButton from "../components/GoogleLoginButton";

/**
 * Component for the login screen.
 *
 * @component
 */
export default function LoginScreen() {
  const authContext = useContext(AuthenticationContext);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require("../../assets/expektus-logo.png")} />
      </View>
      <View style={styles.buttonsContainer}>
        <GoogleSignInButton
          title="Sign In With Google"
          style={styles.google}
          login={authContext.actions.login}
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
