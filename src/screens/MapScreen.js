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
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { locationService } from './LocationService';
import  routeRetriever  from '../utils/RouteRetriever';
import ws from '../utils/ReusableWebSocket';
const { Motorist } = require("../../node_modules/alert-system/src/motorist");
const { Cyclist } = require("../../node_modules/alert-system/src/cyclist");
const { CollisionDetector } = require("../../node_modules/alert-system/src/collisionDetector");

// For sound functionality, basic usage example from: https://github.com/zmxv/react-native-sound was used.
import Sound from 'react-native-sound';

const LOCATION_TASK_NAME = "background-location-task";

const COLORS = [
  '#7F0000',
  '#00000000',
  '#B24112',
  '#E5845C',
  '#238C23',
  '#7F0000',
];

export default class App extends Component {

  constructor(props){
      super(props);
      Sound.setCategory('Playback',true);

      this.state = {
        latitude:0,
        longitude:0,
        direction:0,
        speed:0,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
        cyclists:[],
        hazards:[],
        mapText:"",
        route:[],
      }
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
    const url = require('../../assets/done-for-you.mp3');
    const sound = new Sound(url,error => callback(error,sound));
  }

  addCyclists(cyclists){
    this.setState({
      cyclists: cyclists
    })
  }
  
  onLocationUpdate = ({ latitude, longitude, speed, direction }) => {
    this.setState({
      latitude: latitude,
      longitude: longitude,
      speed: speed,
      direction: direction
    })
  }

  componentDidMount = async () => {
    const { status } = await Location.requestPermissionsAsync();
      if (status === 'granted') {

        locationService.subscribe(this.onLocationUpdate)

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
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
      'direction': this.state.direction,
      'speed': this.state.speed
    };
    // Need to query for cyclists
    console.log(`Sending: ${JSON.stringify(motorRequest)}`);
    ws.send(motorRequest);

    // Update the markers
    let points = ws.getCyclists();
    console.log(points);
    //this.addCyclists(points);

    // Call the Hazard Detection after receiving the nearby points
    let warnings = this.callHazardDetection(points)

    console.log(`Hazards: ${warnings}`);
    /*
    if(warnings === undefined) {
      warnings = [];
    }*/

    // Update the state
    this.setState({
      cyclists: points,
      hazards: warnings
    })

    // Play the Hazard sound if a hazard has been detected
    if(warnings !==null && warnings !== undefined) {
      if(warnings.length > 0) {
        this.playSound(this);
      }
    }
  }

  callHazardDetection = (points) => {
    const motorist = new Motorist("motorist", this.state.longitude,
                                  this.state.latitude, 
                                  this.state.speed,
                                  this.state.direction);
    let cyclists = [];
    let warnings = [];

    points.forEach(user => {
      let bike = new Cyclist(user.key, user.longitude, user.latitude,
                              user.speed, user.direction);
      cyclists.push(bike);
    });

    // Run the Hazard Detection
    let detector = new CollisionDetector();
    if(cyclists.length >= 1) {
      warnings = detector.updateState(motorist, cyclists);
    }

    if(warnings === null || warnings === undefined) {
      return [];
    }
    else {
      return warnings.hazards;
    }
  }

  onRegionChange = (region) => {
    this.setState({
      region : region
    })
  }

  handleRoute = (value) => {
    this.setState({
      mapText:value
    })
  }

  getRoute = async () => {
    startPoint = {latitude:this.state.latitude,longitude:this.state.longitude}
    var routeCoordinates = await routeRetriever(start=startPoint,end=this.state.mapText);
    console.log(routeCoordinates);

    var coordinates = routeCoordinates.map((array) =>
      ({latitude:array[0],longitude:array[1]})
    )

    this.setState({route:coordinates});
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

              <Polyline
                coordinates={this.state.route}
                strokeColor="#000"
                strokeColors={COLORS}
                strokeWidth={6}
              />


            </MapView>

          </View>

          <View style={styles.subContainer}>
            <Button title="Test Element: Sound" onPress={() => {
              return this.playSound(this);
            }}/>
            <TextInput style={styles.textInput} onChangeText={this.handleRoute}/>
            <Button title="Enter Destingation" onPress={() => {
              return this.getRoute();
            }}/>
          </View>

      </View>
      )
  }
}

// Example code used:https://docs.expo.io/versions/latest/sdk/task-manager/#taskmanagerdefinetasktaskname-task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  const timeStamp = new Date();
  if (error) {
    console.log("error")
    return
  }
  if (data.locations.length >= 1) {
    const { latitude, longitude } = data.locations[0].coords
    const speed = data.locations[0].coords.speed;
    const direction = data.locations[0].coords.heading;

    locationService.setLocation({latitude, longitude, speed, direction});

    console.log(`Location Recorded: [${timeStamp}]:\n[${latitude}, ${longitude}, ${direction}, ${speed}]`);
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


