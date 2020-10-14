import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { StyleSheet } from "react-native";
import { SocialIcon } from "react-native-elements";
import * as GoogleSignIn from "expo-google-sign-in";
// import ws from "../utils/ReusableWebSocket";
import Constant from "../utils/Constant";

/**
 * Component for logging in using Google.
 *
 * @component
 */
export default function GoogleLoginButton({ title, login, ...props }) {
  const [authenticating, setAuthenticating] = useState(false);

  const onPress = async () => {
    
    try {
      console.log("Im at google lol")
      setAuthenticating(true);

      await GoogleSignIn.askForPlayServicesAsync();
      const res = await GoogleSignIn.signInAsync();

      console.log(res);
      //console.log("Im at google lol")
      if (res.type === "success") {
        login(Constant.Platform.GOOGLE, res.user.auth.idToken);
      } else {
        setAuthenticating(false);
      }
    } catch (err) {
      setAuthenticating(false);
      console.log("Im the error")
      console.log(err) 
    }
  };

  useEffect(() => {
    (async () => {
      await GoogleSignIn.initAsync({
        webClientId: "999414967380-8apdjsasof2i64fdr745k2qivoiphnfc.apps.googleusercontent.com"
      });

      const user = await GoogleSignIn.signInSilentlyAsync();

      if (user) {
        login(Constant.Platform.GOOGLE, user.auth.idToken);
      }
    })();
  }, []);

  return (
    <SocialIcon
      button
      type="google"
      loading={authenticating}
      title={title}
      style={styles.google}
      onPress={onPress}
      {...props}
    />
  );
}

GoogleLoginButton.propTypes = {
  title: PropTypes.string.isRequired,
  login: PropTypes.func.isRequired
};

const styles = StyleSheet.create({

});
