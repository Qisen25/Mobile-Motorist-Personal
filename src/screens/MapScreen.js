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
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { locationService } from './LocationService';
import  routeRetriever  from '../utils/RouteRetriever';
import ws from '../utils/ReusableWebSocket';

import Sound from 'react-native-sound';

const LOCATION_TASK_NAME = "background-location-task";

export default class App extends Component {

  constructor(props){
      super(props);
      Sound.setCategory('Playback',true);
      this.state = {
        latitude:0,
        longitude:0,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
        cyclists:[],
        mapText:"",
      }
      routeRetriever();
  }

  playSound(component){
    const callback = (error, sound) =>{
      if (error) {
        console.log(error.message);
        return;
      }
      sound.play(() => {
        sound.release();
      });

    };
    const url = require('../../done-for-you.mp3');
    const sound = new Sound(url,error => callback(error,sound));
  }

  addCyclists(cyclists){
    this.setState({
      cyclists: cyclists
    })
  }
  
  onLocationUpdate = ({ latitude, longitude }) => {
    this.setState({
      latitude: latitude,
      longitude: longitude
    })
  }

  componentDidMount = async () => {
    const { status } = await Location.requestPermissionsAsync();
      if (status === 'granted') {

        locationService.subscribe(this.onLocationUpdate)

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
        });
      }
  }

  componentWillUnmount = async () => {
    locationService.unsubscribe(this.onLocationUpdate);
  }

  // This is called when the users location changes
  usersLocationChange = (coords) => {
    // TEST QUERY
    let motorRequest = {
      'type': 'motorist',
      'userID': 'some_id',
      'long': this.state.longitude,
      'lat': this.state.latitude,
      'direction': '23',
      'speed': '19'
    };
    // Need to query for cyclists
    ws.send(motorRequest);

    // Update the markers
    let points = ws.getCyclists();
    this.addCyclists(points);

    //TODO: Potentially place the Alert Detection Here
  }

  onRegionChange = (region) => {
    this.setState({
      region : region
    })
  }

  handleRoute = (value) => {
    //Validate input

    this.setState({
      mapText:value
    })

    //Draw the new route.

  }

  render(){
    return (
   <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image style={styles.logo} source={require("../../assets/expektus-logo.png")} />
          </View>

          <View style={styles.mapContainer} >
            
            <MapView style={styles.map}

              region={{latitude:this.state.latitude,longitude:this.state.longitude,latitudeDelta:this.state.latitudeDelta,longitudeDelta:this.state.longitudeDelta}}
              onRegionChange={this.onRegionChange}
              onUserLocationChange={this.usersLocationChange}
              showsUserLocation={true}
              minZoomLevel={18}
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
              {
                this.state.cyclists.map(marker =>(
                  <Marker
                    key={marker.key}
                    coordinate={{
                      latitude: marker.latitude,
                      longitude: marker.longitude}}
                  >
                    <Image
                      source={require('../../assets/bikeIcon.png')}
                      style={{width: 28, height: 28}}
                      resizeMode="contain"
                    />
                  </Marker>))
              }
            </MapView>

          </View>

          <View style={styles.subContainer}>
            <Button title="Test Element: Sound" onPress={() => {
              return this.playSound(this);
            }}/>
            <TextInput style={styles.textInput} onChangeText={this.handleRoute}/>
            <Button title="Enter Destingation"/>
            <Text>Test Element: {this.state.mapText}</Text>
          </View>

      </View>
      )
  }
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.log("error")
    return
  }
  if (data) {
    const { latitude, longitude } = data.locations[0].coords
    locationService.setLocation({
      latitude,
      longitude
    });
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
  },
  textInput:{
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
  }
})


