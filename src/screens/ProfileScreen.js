import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, Input } from "react-native-elements";
import AuthenticationContext from "../contexts/AuthenticationContext";


export default function ProfileScreen() {
  const auth = useContext(AuthenticationContext);

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar
          rounded
          size="xlarge"
          source={{
            uri: auth.state.user.photoURL
          }}
        />
      </View>
      <Input
        disabled
        label="Email"
        value={auth.state.user.email}
      />
      <Input
        disabled
        label="First Name"
        value={auth.state.user.firstName}
      />
      <Input
        disabled
        label="Last Name"
        value={auth.state.user.lastName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 32
  },
  avatarContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32
  }
});
