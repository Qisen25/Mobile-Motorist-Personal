import React, { useState } from "react";
import PropTypes from "prop-types";
import { StyleSheet, View, Text } from "react-native";
import { Slider } from 'react-native-elements';


/**
 * Component for the settings screen.
 *
 * @component
 */
export default function SettingsScreen({ navigation }) {
  const [degrees, setDegrees] = useState(90);
  
  const onValueChange = (value) => setDegrees(value);

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        <Text>Degrees: {degrees}</Text>
        <Slider
          value={degrees}
          minimumValue={90}
          maximumValue={180}
          onValueChange={onValueChange}
        />
      </View>
    </View>
  );
}

SettingsScreen.propTypes = {
  navigation: PropTypes.object.isRequired
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: 20
  },
  sliderContainer: {
    
  }
});
