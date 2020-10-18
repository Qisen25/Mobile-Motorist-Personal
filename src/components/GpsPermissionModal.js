import React, { Component } from 'react';
import { Modal, Text, TouchableOpacity, View, Alert,StyleSheet } from 'react-native';
import { openSettings } from 'react-native-permissions';

/**
 * Pop up dialog component for making sure gps permissions are granted
 */
export default class GpsPermissionModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false
    };
  }

  GpsPermissionPopup = () => {
    this.setState({
      modalVisible: true
    })
  };

  render() {
    return (
      <Modal transparent={true} visible={this.state.modalVisible} >
        <View style={styles.modal}>
          <View style={styles.modalContainer}>
            {modalHeader}
            {modalBody}
                <View style={{flexDirection:"row-reverse",margin:10}}>
          
                  <TouchableOpacity style={{...styles.actions,backgroundColor:"#127bd6"}}
                    onPress={() => {
                        openSettings();
                        this.setState({
                          modalVisible: false
                        })
                    }}>
                    <Text style={styles.actionText}>Go to Settings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={{...styles.actions,backgroundColor:"#db2828"}} 
                    onPress={() => {
                      this.setState({
                        modalVisible: false
                      })
                    }}>
                    <Text style={styles.actionText}>No</Text>
                  </TouchableOpacity>
                </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modal:{
    backgroundColor:'rgba(0, 0, 0, 0.5)',
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer:{
    backgroundColor:"#f9fafb",
    width:"80%",
    borderRadius:5
  },
  modalHeader:{
  },
  title:{
    fontWeight:"bold",
    fontSize:20,
    padding:15,
    color:"#000"
  },
  divider:{
    width:"100%",
    height:1,
    backgroundColor:"lightgray"
  },
  modalBody:{
    backgroundColor:"#fff",
    paddingVertical:20,
    paddingHorizontal:10
  },
  modalFooter:{
  },
  actions:{
    borderRadius:5,
    marginHorizontal:10,
    paddingVertical:10,
    paddingHorizontal:20
  },
  actionText:{
    color:"#fff"
  }
});

const modalHeader=(
  <View style={styles.modalHeader}>
    <Text style={styles.title}>Location permission is required </Text>
    <View style={styles.divider}></View>
  </View>
)

const modalBody=(
  <View style={styles.modalBody}>
    <Text style={styles.bodyText}>Please give us permissions to use your GPS location. Expektus will not work without it</Text>
  </View>
)