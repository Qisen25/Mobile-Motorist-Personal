import React, { Component, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Button,
  TextInput,
  TouchableOpacity,
  Image,
  ToastAndroid,
} from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { locationService } from './LocationService';
import  routeRetriever  from '../utils/RouteRetriever';
import routeTools from "../utils/RouteTools";
import ws from '../utils/ReusableWebSocket';
const { Motorist } = require("../../node_modules/alert-system/src/motorist");
const { Cyclist } = require("../../node_modules/alert-system/src/cyclist");
const { CollisionDetector } = require("../../node_modules/alert-system/src/collisionDetector");
import AuthenticationContext from "../contexts/AuthenticationContext";
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import KeepAwake from 'react-native-keep-awake';
import GpsPermissionModal from '../components/GpsPermissionModal'

import RNFS from "react-native-fs";

// For sound functionality, basic usage example from: https://github.com/zmxv/react-native-sound was used.
import Sound from 'react-native-sound';

const LOCATION_TASK_NAME = "background-location-task";
const GPS_LOG_FILE = "GPS_LOGS.txt";
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

let watchPos = null;

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
      this.gpsPermModalProp = React.createRef();

      this.state = {
        latitude:0,
        longitude:0,
        direction:0,
        speed:0,
        latitudeDelta: 0.000012,
        longitudeDelta: 0.00121,
        // latitudeDelta: 0.0922,
        // longitudeDelta: 0.0421,
        cyclists:[],
        hazards:[],
        mapText:"",
        route:[],
        // intervalID: null, // No need just chuck just chuck usersLocationChange in onLocationUpdate
        logging: false,
        logTag: "default",
        routeCounter:0,
        fetchingCycs: null
      }
  }

  locationActive = false;

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

    //On every 3 location updates, check route integrity
    if(this.state.routeCounter%5==0){
      this.validateRoute();
      console.log("VALIDATING ROUTE");
      this.state.routeCounter = 1;
    }
    this.state.routeCounter = this.state.routeCounter + 1;
    this.usersLocationChange(); // Moved from interval thing
  }

  validateRoute = () => {
    
    if(this.state.route.length>0){
      var updatedRoute = routeTools.routeIntegrity(this.state.direction,[this.state.latitude,this.state.longitude],this.state.route);
      
      if(updatedRoute.length>0) {
        console.log("updatedRoute.length>0");
        //Update the route to the updated array
        this.setState({
          route:updatedRoute
        })
      }else {
        console.log("getting a new route");
        //get a new route
        this.getRoute();
      }
    }
  }

  componentDidMount = async () => {
    const { status } = await Location.requestPermissionsAsync();
    console.log(`Map Screen mounted? ${this.locationActive}`);
    if (status === 'granted') {

      this.initLocation();
     
    } else {
      // interval check if permission not granted then tell user to give perms
      let checkPerms = setInterval( async () => {
        let perm = await Location.getPermissionsAsync();
        if (perm.granted) {
          if(!this.locationActive) {
            this.initLocation();
          }
          clearInterval(checkPerms);
        } else {
          if (this.locationActive) {
            this.stopLocation();
          }
          // Show user our custom dialog to please give location permisions
          this.gpsPermModalProp.current.GpsPermissionPopup();
        }
      }, 6000);
    }

    let path = RNFS.DocumentDirectoryPath + '/' + GPS_LOG_FILE;
    if(!RNFS.exists(path)) {
      RNFS.writeFile(path, 'GPS Log:\n', 'utf8')
        .then((success) => {
          console.log('FILE WRITTEN!');
          console.log(RNFS.ExternalDirectoryPath + '/' + GPS_LOG_FILE);
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
  }

  /**
   * Mount tracker tasks 
   */
  initLocation = async () => {
    locationService.subscribe(this.onLocationUpdate);

    console.log("GPS mounted");

    // Try get the first pos to render map faster
    let lastPos = {}; 
    try {
      lastPos = await Location.getLastKnownPositionAsync();
    } catch(error) {
      // Last location may not be found since gps never turned on previously or phone restarted/shutdown
      // Try search for current location quickly on mount         
      if (error.message.includes("Last known location not found")) {
          console.log("Last known location not found");
          lastPos = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.BestForNavigation});
      }
    }

    const coords = lastPos.coords;

    locationService.setLocation({
      latitude: coords.latitude, 
      longitude: coords.longitude, 
      speed: coords.speed, 
      direction: coords.heading
    });

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      // distanceInterval: 0,
      timeInterval: 950, //time interval might be better
      foregroundService: {
        notificationTitle: "Location Tracking",
        notificationBody: "Expektus is tracking your location."
      }
    });

    console.log("+++++++ Map Screen component mounted +++++++");
    // Keep screen awake during Nav
    KeepAwake.activate();

    // ** No need interval just chuck usersLocationChange in onLocationUpdate **
    // const id = setInterval(() => {
    //   this.usersLocationChange();
    // }, 1000);

    // this.setState({
    //   intervalID: id
    // });

    // This makes sure that gps doesn't only rely on background task
    // (React native background tasks don't seem to work older androids (lollipop))
    // Will uncomment this later.
    // watchPos = await Location.watchPositionAsync(
    //     {
    //       accuracy: Location.Accuracy.BestForNavigation,
    //       timeInterval: 1200,
    //       distanceInterval: 1,
    //     },
    //     async (location) => {
    //         let coords = location.coords;
    //         // This function gets more consistent direction heading
    //         let head = await Location.getHeadingAsync();
    //         const cycData = {
    //           type: "motorist",
    //           longitude: coords.longitude,
    //           latitude: coords.latitude,
    //           direction: head.magHeading,
    //           speed: coords.speed,
    //           task: "watcher"
    //         };

    //         locationService.setLocation(cycData);
    //         this.usersLocationChange();
    //     },
    //     error => console.log(error)
    // );

    // Interval to retrieve cyclists independent of motorist movement
    this.state.fetchingCycs = setInterval(() => {
      // Update the markers
      if (this.locationActive) {
        let points = ws.getCyclists();
        // let points = JSON.parse(message.data)
        console.log(points);
        // this.addCyclists(points);
        this.state.cyclists = points;

        // Call the Hazard Detection after receiving the nearby points
        let warnings = this.callHazardDetection(points)

        console.log(`Hazards: ${warnings}`);
        /*
        if(warnings === undefined) {
          warnings = [];
        }*/

        console.log(this.locationActive);
        // Update the state
        // this.setState({
        //   cyclists: points,
        //   hazards: warnings
        // })
        this.state.cyclists = points;
        this.state.hazards = warnings;

        // Play the Hazard sound if a hazard has been detected
        if(warnings !==null && warnings !== undefined) {
          if(warnings.length > 0) {
            this.playSound(this);
          }
        }
      }

      // if(!this.locationActive) {
      //   clearInterval(this.state.fetchingCycs);
      // }

    }, 1200);

    // Add event listener for when server sends cyclists data to us
    // ws.ws.addEventListener("message", this.websocketGetCyclists);

    this.locationActive = true;
  }

  /**
   * Call back for getting cyclists from websocket
   * Could be used instead of interval but will update constantly
   */
  // websocketGetCyclists = (message) => {
    
  // }

  /**
   * Stop/clean up location tasks
   */
  stopLocation = async () => {
    console.log(`Map Screen mounted? ${this.locationActive}`);
    if (this.locationActive) {
      console.log("Removing keep awake and close socket");
      this.locationActive = false;
      try {
        KeepAwake.deactivate();
      } catch(error) {
        console.log(error);
      }
      //ws?.ws?.removeEventListener("message", this.websocketGetCyclists)
      ws?.close();
    }
    this.locationActive = false;
    // Clean up background tasks
    await watchPos?.remove();
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    await TaskManager.unregisterAllTasksAsync();
    console.log("+++++++ Unmounted Map Screen! Array below should show no tasks. +++++++++")
    console.log(await TaskManager.getRegisteredTasksAsync());

    locationService.unsubscribe(this.onLocationUpdate);
  }

  componentWillUnmount = async () => {
    
    //clearInterval(this.state.intervalID);
    clearInterval(this.state.fetchingCycs);  
    this.stopLocation();
  }

  // This is called when the users location changes
  usersLocationChange = (coords) => {

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
    try {
      ws.send(motorRequest);

      // Moved the ws.getCyclists(); hazards stuff into interval. Move back if calculations work better here

      // Check if logging
      if(this.state.logging) {
        let path = RNFS.ExternalDirectoryPath + '/' + GPS_LOG_FILE;
        RNFS.appendFile(path, `${this.state.logTag} => ${JSON.stringify(motorRequest)}\n`, 'utf8')
            .then((success) => {
            })
            .catch((err) => {
              console.log(err.message);
            });
      }
    } catch(error) {
      console.log(error);
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

  /**
   * @returns JSX object that represents drawing the Motorist Marker on the Map
   */
  drawMotorist = () => {
    // Variables
    const motoristRadius = 6;
    const drawRadius = true;
    const showSpeed = true;

    return (
      <View>
        <Marker
          coordinate={{
            latitude: this.state.latitude,
            longitude: this.state.longitude}}
          anchor={{
            x: 0.5,
            y: 0.5
          }}
          title={`${this.state.speed.toFixed(2)} m/s`}
        >
        <Image
          source={require('../../assets/Arrow.png')}
          style={{
            width: 28,
            height: 28,
            transform: [{
              rotate: `${this.state.direction}deg`
            }]}}
          resizeMode="contain"
        />
      </Marker>
      {
        // Conditionally Draw the circle based on flag
        drawRadius &&
        <Circle 
          center={{
            latitude: this.state.latitude,
            longitude: this.state.longitude}}
          radius={motoristRadius}
        />
      }
      </View>);
  }

  getRoute = async () => {
    var startPoint = {latitude:this.state.latitude,longitude:this.state.longitude}
    var routeCoordinates = await routeRetriever(start=startPoint,end=this.state.mapText,currentOrientation=this.state.direction);
    //console.log(routeCoordinates);
    
    if (routeCoordinates != undefined) {
      var coordinates = routeCoordinates.map((array) =>
        ({latitude:array[0],longitude:array[1]})
      )

      this.setState({route:coordinates});
    }
  }

  render(){
    return (
   <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image style={styles.logo} source={require("../../assets/expektus-logo.png")} />
          </View>

          <GpsPermissionModal ref={this.gpsPermModalProp} />

          <View style={styles.mapContainer} >
            
            <MapView style={styles.map}

              region={{latitude:this.state.latitude,longitude:this.state.longitude,latitudeDelta:this.state.latitudeDelta,longitudeDelta:this.state.longitudeDelta}}
              onRegionChange={this.onRegionChange}

              // zoom out
              // lat deltas can handle zoom levels
              onDoublePress={() => {
                this.setState({
                  latitudeDelta: 0.00512,
                  // longitudeDelta: this.state.longitudeDelta - LONGITUDE_DELTA
                })
              }}

              // zoom in
              onLongPress={() => {
                this.setState({
                  latitudeDelta: 0.000012,
                  // longitudeDelta: this.state.longitudeDelta - LONGITUDE_DELTA
                })
              }}
            >

              {
                // Draw the Cyclists
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

              {
                // Draw the Motorist
                this.drawMotorist()
              }

              <Polyline
                coordinates={this.state.route}
                strokeColor="#000"
                strokeColors={COLORS}
                strokeWidth={6}
              />


            </MapView>
            <View
              style={styles.loggingStyle}>
                {
                  this.state.logging &&
                  <Button title="Log"
                    color="#FF0000"
                    onPress={() => {this.setState({
                      logging: false
                    })}}/>
                }
                {
                  !this.state.logging &&
                  <Button title="Log"
                    color="#F4860B"
                    onPress={() => {this.setState({
                      logging: true
                    })}}/>
                }
                <TextInput style={styles.textInput} onSubmitEditing={(event) => {
                  this.state.logTag = event.nativeEvent.text;
                }}
                placeholder={"Enter TAG"}/>
            </View>
          </View>

          <View style={styles.subContainer}>
            <Button title="Test Element: Sound" onPress={() => {
              return this.playSound(this);
            }}/>
            <TextInput style={styles.textInput} onChangeText={this.handleRoute}/>
            <Button title="Enter Destination" onPress={() => {
              return this.getRoute();
            }}/>
          </View>
          <Logout title="Logout"/>
      </View>
      )
  }
}

let hasFirstPosSet = false;
// Example code used:https://docs.expo.io/versions/latest/sdk/task-manager/#taskmanagerdefinetasktaskname-task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  const timeStamp = new Date();
  if (error) {
    console.log("error")
    return
  }
  if (data.locations.length >= 1) {
    let res;
    let heading;
    // console.log(data.locations.length)
    // Send the data.location heading first to load map & reduce unnecessary wait then call await req
    if(hasFirstPosSet) {
      res = await Location.getHeadingAsync(); // This gives more stable direction readings
      heading = res.trueHeading;
    }
    else {
      heading = data.locations[0].coords.heading;
    }

    const { latitude, longitude } = data.locations[0].coords;
    const speed = data.locations[0].coords.speed;
    // const direction = data.locations[0].coords.heading;
    const direction = heading;

    locationService.setLocation({latitude, longitude, speed, direction});

    console.log(`Location Recorded: [${timeStamp}]:\n[${latitude}, ${longitude}, ${direction}, ${speed}]`);
    hasFirstPosSet = true;// Send and plug first pos then can do await getHeadingAsync
  }
});

/**
 * Logout button which helps redirect to login screen
 */
function Logout() {
  const auth = useContext(AuthenticationContext);
  
  return (
    <TouchableOpacity style={[{ width: "35%", borderRadius: 10, backgroundColor: "#3b5998", paddingVertical: 3, }]} onPress={() => {
      auth.actions.logout(auth.state.platform);
    }}>
      <Text style={[{
        fontSize: 18,
        color: "#fff",
        fontWeight: "bold",
        alignSelf: "center",
        textTransform: "uppercase"
      }]}>Logout</Text>

    </TouchableOpacity>
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
  },
  loggingStyle:{
    position: "absolute",
    top: "0%",
    flexDirection: "row"
  }
})


