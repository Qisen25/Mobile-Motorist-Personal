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
const hazardDetect = require("../../node_modules/alert-system/src/collisionDetector");
import AuthenticationContext from "../contexts/AuthenticationContext";
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import KeepAwake from 'react-native-keep-awake';
import GpsPermissionModal from '../components/GpsPermissionModal'

// File Loading
import RNFS from "react-native-fs";
import DocumentPicker from 'react-native-document-picker';

// For sound functionality, basic usage example from: https://github.com/zmxv/react-native-sound was used.
import Sound from 'react-native-sound';

const LOCATION_TASK_NAME = "background-location-task";
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

      // Initialise the detector
      this.collisionDetector = new CollisionDetector(null, null, this.hazardCallback);

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
        displayingRoute:false,
        // intervalID: null, // No need just chuck just chuck usersLocationChange in onLocationUpdate
        logging: false,
        logFilename: "default",
        routeCounter:0,
        fetchingCycs: null,
        playingLoadedRoute: false,
        routeFile: "None",
        loadedRouteContents: [],
        loadedRouteMarker: 0,
      }
  }

  locationActive = false;
  watchHead = null;

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

  warnIntersect = (dist) => {
    ToastAndroid.showWithGravityAndOffset(
      `In about ${dist}m you may cross paths with a cyclist!`,
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM,
      25,
      50
    );
  };

  playBell(component){
    const callback = (error, sound) =>{
      if (error) {
        console.log(error.message);
        return;
      }
      sound.play(() => {
        sound.release();
      });

    };
    const url = require('../../assets/bell.mp3');
    const sound = new Sound(url,error => callback(error,sound));
  }

  addCyclists(cyclists){
    this.setState({
      cyclists: cyclists
    })
  }

    /**
   * The hazard callback to update the UI and respond to the hazards that are determined
   * @param {Alert} alert : The alert object returned once the collision detection is complete
   */
  hazardCallback = (alert) => {
    let hazards = null;

    // Check if the alert returns no hazards
    if(alert === null) {
      hazards = [];
      console.log("No Hazards");
    }
    else {
      /**
       * To avoid having the warning sound repeat multiple times after a hazard has already
       * been determined compare the new hazards list with the current list to determine
       * if new hazards have been identifed
       */
      hazards = alert.hazards;

      if(this.newHazardFound(this.state.hazards, hazards)) {
        // Play the warning sound
        this.playSound(this);
      }
    }

    // Update Hazards state to redraw the UI
    this.setState({
      hazards: hazards
    });
  }

  /**
   * Determines if a new hazard has been identified
   * @param {Array<Hazard>} currentHazards : The currenttly stored hazards known to the motorist
   * @param {Array<Hazard>} newHazards : The new list of identified hazards (Can't be empty [])
   */
  newHazardFound = (currentHazards, newHazards) => {
    // All newHazards are actually new
    if(currentHazards.length === 0) {
      return true;
    }

    // Iterate over newHazards to check if they are currently in the current hazards
    newHazards.forEach(nHazard => {
      const id = nHazard.vehicle.id;
      const index = currentHazards.findIndex(cHazard => cHazard.vehicle.id === id);

      // Vehicle not found
      if(index === -1) {
        return true;
      }
    });

    return false;
  }

  onLocationUpdate = ({ latitude, longitude, speed, direction }) => {
    if(!this.state.playingLoadedRoute) {
      this.setState({
        latitude: latitude,
        longitude: longitude,
        speed: speed,
        direction: direction
      })
    }

    //On every 3 location updates, check route integrity
    if(this.state.routeCounter%5==0){
      this.validateRoute();

      this.state.routeCounter = 1;
    }
    this.state.routeCounter = this.state.routeCounter + 1;
    this.usersLocationChange(); // Moved from interval thing
  }

  validateRoute = () => {
    if(this.state.displayingRoute) {
    //if(this.state.route.length>0){
      console.log("Test2: Validating Route");
      var routeCopy = [];
      routeCopy = [...this.state.route];

      var routeArrivalStatus = false;
      var updatedRoute = [];
      var routeToolsResponse = {};

      var routeToolsResponse = routeTools.routeIntegrity(this.state.direction,[this.state.latitude,this.state.longitude],routeCopy);
      
      updatedRoute = routeToolsResponse.newRoute;
      routeArrivalStatus = routeToolsResponse.status;

      //has arrival occurred? Or was the  route cancelled due to being too small?
      if (routeArrivalStatus == true) {
          console.log("arrived");
          this.setState({
            route:[]
          });
          this.state.displayingRoute = false;
      } else {

          // route has been shrunk, update it.
          if(updatedRoute.length>0) {
            console.log();
            console.log("updatedRoute.length:",updatedRoute.length);
            console.log(updatedRoute);
            //Update the route to the updated array
            this.setState({
              route:updatedRoute
            }); 
          // currentPosition was not in the route, and  arrival has not 
          // occurred, get a new route.
          } else {;
            //get a new route
            this.getRoute();
          }
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
      distanceInterval: 2,
      // timeInterval: 1500, //time interval might be better
      foregroundService: {
        notificationTitle: "Location Tracking",
        notificationBody: "Expektus is tracking your location."
      }
    });

    this.watchHead = setInterval( async () => {
      if(this.state.speed < 0.5) {
        const heading = await Location.getHeadingAsync();
        this.setState({direction: heading.trueHeading})
      }
    }, 1400);

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
        // console.log(points);
        // this.addCyclists(points);
        this.state.cyclists = points;
        
        if(points.length > 0) {
          // Call the Hazard Detection after receiving the nearby points
          this.callHazardDetection(points);

          // let detector = new CollisionDetector();
          /* TESTING ALERTS
          let intersect = hazardDetect.crossPathEstimation(this.state, points);

          console.log(intersect.length);
          if(intersect.length > 0) {
            this.playBell(this);
            this.warnIntersect(intersect[0].intersectDist);
          }
          */

          // console.log(`Hazards: ${warnings}`);
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

        }// end if point.length
      }// end if
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
    clearInterval(this.watchHead);
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

    let motorRequest = {};

    if(this.state.playingLoadedRoute) {
      let mockData = JSON.parse(this.state.loadedRouteContents[this.state.loadedRouteMarker]
                     .split("=>")[1]);

      motorRequest = {
        'type': 'motorist',
        'userID': 'some_id',
        'long': mockData.long,
        'lat': mockData.lat,
        'direction': mockData.direction,
        'speed': mockData.speed
      };

      // Update state to show mock location of the map
      this.setState({
        latitude: motorRequest.lat,
        longitude: motorRequest.long,
        direction: motorRequest.direction,
        speed: motorRequest.speed
      });

      // Increment the position in the loaded file
      this.state.loadedRouteMarker = (this.state.loadedRouteMarker + 1 ) % (this.state.loadedRouteContents.length - 1 );
    }
    else {
      motorRequest = {
        'type': 'motorist',
        'userID': 'some_id',
        'long': this.state.longitude,
        'lat': this.state.latitude,
        'direction': this.state.direction,
        'speed': this.state.speed
      };
    }

    // Time that the GPS was read
    let timestamp = new Date()

    // Need to query for cyclists
    console.log(`Sending: ${JSON.stringify(motorRequest)}`);
    try {
      ws.send(motorRequest);

      // Moved the ws.getCyclists(); hazards stuff into interval. Move back if calculations work better here

      // Check if logging
      if(this.state.logging) {
        // Check if the filename specified exists
        let path = RNFS.ExternalDirectoryPath + "/" + this.state.logFilename + ".txt";
        if(!RNFS.exists(path)) {
          RNFS.writeFile(path, '', 'utf8')
            .then((success) => {
              console.log(`File Created: ${path}`);
            })
            .catch((err) => {
              console.log(err.message);
            });
        }
        let gps = {
          'long': motorRequest.long,
          'lat': motorRequest.lat,
          'direction': motorRequest.direction,
          'speed': motorRequest.speed
        };
        RNFS.appendFile(path, `[${timestamp}]=>${JSON.stringify(gps)}\n`, 'utf8')
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

    points.forEach(user => {
      let bike = new Cyclist(user.key, user.longitude, user.latitude,
                              user.speed, user.direction);
      cyclists.push(bike);
    });

    // Run the Hazard Detection
    // Only run detection if cyclists have been found
    if(cyclists.length >= 1) {
      this.collisionDetector.updateState(motorist, cyclists);
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
   * @returns Array of JSXs object that represents drawing all the
   *          cyclists in the list onto the map
   */
  drawCyclists = () => {
    let cyclistJSX = [];
    const icon = "../../assets/bikeIcon.png";

    this.state.cyclists.forEach(cyclist => {
      let jsx = <Marker
                  key={cyclist.id}
                  coordinate={{
                    latitude: cyclist.latitude,
                    longitude: cyclist.longitude}}
                  anchor={{
                    x: 0.5,
                    y: 0.5
                  }}
                >
                <Image
                  source={require(icon)}
                  style={this.getCyclistImageStyle(cyclist.direction)}
                  resizeMode="contain"
                />
                </Marker>;

      cyclistJSX.push(jsx);
    });

    return cyclistJSX;
  }

  /**
   * Returns the style for the cyclist icon depending on the bearing of the cyclist
   * @param {Number} direction : Bearing in degrees
   */
  getCyclistImageStyle(direction) {
    const width = 16;
    const height = 16;

    // If greater than 180 rotate the image and flip
    if(direction > 180) {
      return {
        width: width,
        height: height,
        transform: [
          {scaleX: -1},
          {rotate: `${direction - 270.0}deg`}
        ]
      }
    }
    // Just rotate the image, no need to flip
    else {
      return {
        width: width,
        height: height,
        transform: [{
          rotate: `${direction - 90.0}deg`
        }]
      }
    }
  }

  /**
   * @returns Array of JSXs object that represents drawing all the
   *          hazards in the list onto the map
   */
  drawHazards = () => {
    let hazardsJSX = [];
    const icon = "../../assets/bikeIconHazard.png";

    this.state.hazards.forEach(hazard => {
      let jsx = <Marker
                  key={hazard.id}
                  coordinate={{
                    latitude: hazard.latitude,
                    longitude: hazard.longitude}}
                >
                <Image
                  source={require(icon)}
                  style={{width: 16, height: 16}}
                  resizeMode="contain"
                />
                </Marker>;

      hazardsJSX.push(jsx);
    });

    return hazardsJSX;
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
            width: 16,
            height: 16,
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
    var routeCoordinates = undefined;
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
          <GpsPermissionModal ref={this.gpsPermModalProp} />

          <View style={styles.mapContainer} >
            
            <MapView style={styles.map}

              region={{latitude:this.state.latitude,longitude:this.state.longitude,latitudeDelta:this.state.latitudeDelta,longitudeDelta:this.state.longitudeDelta}}
              onRegionChange={this.onRegionChange}
              minZoomLevel={19}

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
                /*
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
                  */
                 this.drawCyclists()
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
            <View>
              {
                // Check to see if hazards are 
                (this.state.hazards.length > 0) &&
                <Image source={require("../../assets/Hazard.png")}
                  style={styles.hazardStyle}/>
              }
            </View>

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
                  this.state.logFilename = event.nativeEvent.text;
                }}
                placeholder={"Enter File Name"}/>
            </View>
              <View style={styles.routePlayStyle}>
                  {
                    // Button to load the Route File
                    <TouchableOpacity onPress={async () => {
                        console.log("loading file");
                        try {
                          // Let the User pick the file
                          const response = await DocumentPicker.pick({
                            type: [DocumentPicker.types.plainText],
                          });

                          // Load the selected file into memory
                          RNFS.readFile(response.uri, 'utf8')
                              .then((contents) => {
                                this.setState({
                                  loadedRouteContents: contents.split("\n"),
                                  routeFile: response.name});
                              })
                              .catch((err) => {
                                console.log(err.message);
                              });
                        } catch (err) {
                          if (DocumentPicker.isCancel(err)) {
                          }
                          else {
                            console.log(err);
                          }
                        }
                    }}>
                      <Image source={require("../../assets/load.png")}
                            style={{height: 30, width: 30}}/>
                    </TouchableOpacity>
                  }
                  {
                    this.state.playingLoadedRoute &&
                    <TouchableOpacity onPress={async () => {
                        this.setState({playingLoadedRoute: false});
                    }}>
                      <Image source={require("../../assets/stop.png")}
                            style={{height: 30, width: 30}}/>
                    </TouchableOpacity>
                  }
                  {
                    !this.state.playingLoadedRoute &&
                    <TouchableOpacity onPress={async () => {
                        this.setState({playingLoadedRoute: true});
                    }}>
                      <Image source={require("../../assets/play.png")}
                            style={{height: 30, width: 30}}/>
                    </TouchableOpacity>
                  }
                  <Text style={styles.routeFileText}>{this.state.routeFile}</Text>
            </View>
          </View>

          <View style={styles.subContainer}>
            <Button title="Enter Destination" onPress={() => {
              this.state.displayingRoute = true;
              return this.getRoute();
            }}/>
            <TextInput style={styles.textInput} onChangeText={this.handleRoute}/>
            <Button title="Remove route" onPress={() => {
              this.state.displayingRoute = false;
                this.setState({
              route:[]
             });
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
    let heading;
    
    // Removed getHeadingAsync since have better understanding now.
    // getHeadingAsync should be used when user is idle not when moving.
    // Google maps is also not accurate with getting bearing
    heading = data.locations[0].coords.heading;

    const { latitude, longitude } = data.locations[0].coords;
    const speed = data.locations[0].coords.speed;
    // const direction = data.locations[0].coords.heading;
    const direction = heading;

    locationService.setLocation({latitude, longitude, speed, direction});

    // console.log(`Location Recorded: [${timeStamp}]:\n[${latitude}, ${longitude}, ${direction}, ${speed}]`);
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
  },
  loggingStyle:{
    position: "absolute",
    top: "0%",
    flexDirection: "row"
  },
  routePlayStyle:{
    position: "absolute",
    top: "15%",
    flexDirection: "row"
  },
  hazardStyle:{
    position: "absolute",
    bottom: "2%",
    transform: [{
      scale: 0.5
    }]
  },
  routeFileText: {
    flex: 1,
    marginTop: 5,
    marginLeft: 3,
    fontWeight: "bold",
    justifyContent: 'center',
    alignItems: 'center'
  }
})


