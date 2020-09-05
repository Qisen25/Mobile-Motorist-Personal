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

import Sound from 'react-native-sound';


const LOCATION_TASK_NAME = "background-location-task";

function playSound(component){
  const callback = (error, sound) =>{
    if (error) {
      console.log(error.message);
      return;
    }
    sound.play(() => {
      sound.release();
    });

  };
  //Here...apply your customly loaded sound
  url = require('../../done-for-you.mp3');
  const sound = new Sound(url,error => callback(error,sound));
}

//Require state so use class over functional component
export default class App extends Component {

constructor(props) {
    super(props);
    Sound.setCategory('Playback',true);
  }

state = {
    latitude:0,
    longitude:0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
    cyclists:[{coordinate:{latitude:37.508,longitude:-122.34},key:1}],
}

  addCyclists({cyclists})
  {
    this.setState({
      cyclists:cyclists
    })
  }

  onLocationUpdate = ({ latitude, longitude }) => {
    this.setState({
      latitude: latitude,
      longitude: longitude
    })
  }


getInitialState() {
  return {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
}

componentDidMount = async () => {
  const { status } = await Location.requestPermissionsAsync();
    if (status === 'granted') {
      //console.log('granted')

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

render(){
  //console.log("THIRD");
  return (
   
 <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require("../../assets/expektus-logo.png")} />
        </View>

        <View style={styles.mapContainer} >
          
          <MapView style={styles.map}

            region={{latitude:this.state.latitude,longitude:this.state.longitude,latitudeDelta:this.state.latitudeDelta,longitudeDelta:this.state.longitudeDelta}}
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
            />
            {this.state.cyclists.map(marker =>(
              <Marker
                key={marker.key}
                coordinate={marker.coordinate}
              />
            ))}
          </MapView>

        </View>

        <View style={styles.subContainer}>
          <Text>Lat: {this.state.latitude}</Text>
          <Text>Lng: {this.state.longitude}</Text>
          <Button title="Sound" onPress={() => {
            return playSound(this);
          }}/>
        </View>

    </View>
    )
  }
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.log("error")
    //return;
  }
  if (data) {
    //const { locations } = data;
    const { latitude, longitude } = data.locations[0].coords
    //console.log(data.locations)
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


