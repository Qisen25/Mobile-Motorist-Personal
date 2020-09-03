import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Button,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { locationService } from './LocationService';



const LOCATION_TASK_NAME = "background-location-task";


export default class App extends Component {

state = {
    region: {
      latitude: -31.922529,
      longitude: 115.871549,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    latitude:0,
    longitude:0,
}

  onLocationUpdate = ({ latitude, longitude }) => {
    this.setState({
      latitude: latitude,
      longitude: longitude
    })
  }


getInitialState() {
  return {
    region: {
      latitude: -31.922529,
      longitude: 115.871549,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    latitude:0,
    longitude:0,
  };
}

componentDidMount = async () => {
  const { status } = await Location.requestPermissionsAsync();
    if (status === 'granted') {
      console.log('granted')

      //Testing
      locationService.subscribe(this.onLocationUpdate)

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
      });
    }
}

//Testing
componentWillUnmount() {
  locationService.unsubscribe(this.onLocationUpdate)
}

onRegionChange = (region) => {
  this.setState({
    region : region
  })
}


//NOTE: In the blow render, MapView.region requires latitutdeDetla and longitudeDelta
render(){
  return (
   
 <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require("../../assets/expektus-logo.png")} />
        </View>

        <View style={styles.mapContainer} >
          
          <MapView style={styles.map}

            region={{latitude:this.state.latitude,longitude:this.state.longitude}}
            onRegionChange={this.onRegionChange}
          >
            <Marker 
              coordinate={
               {
                  latitude:this.state.latitude,
                  longitude:this.state.longitude,
                }
              }
              style={styles.map}
            >
            
            </Marker>
          </MapView>

        </View>

        <View style={styles.subContainer}>
          <Text>Lat: {this.state.latitude}</Text>
          <Text>Lng: {this.state.longitude}</Text>
        </View>

    </View>
    )
  }
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    console.log("error")
    //return;
  }
  if (data) {
    //const { locations } = data;
    const { latitude, longitude } = data.locations[0].coords
    console.log(latitude, ' - ',longitude)
    locationService.setLocation({
      latitude,
      longitude
    })
    // do something with the locations captured in the background

  }
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: 10
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: "10%"
  },
  mapContainer: {
    flex:2,
  },
  subContainer:{
    flex:1,
  },
  logo: {
    width: "75%",
    resizeMode: "contain"
  },
  map:{
    flex:1,
    borderWidth: 1,
    borderColor: "#20232a",
  },
  marker:{
    width: 20,
    height:20,
  }
})


