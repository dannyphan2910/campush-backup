import React from 'react'
import { Camera } from 'expo-camera';
import { TouchableOpacity } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ImageHelper } from '../helper/helper';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function CameraView({ closeCamera, addImageURI }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [cameraRef, setCameraRef] = useState(null)
    const [type, setType] = useState(Camera.Constants.Type.back);

    Keyboard.dismiss()

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (hasPermission === null) {
        return <View />;
    }

    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    const resetType = () => {
        setType(
            type === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
        );
    }

    const takePhoto = async() => {
        if (cameraRef) {
            let photo = await cameraRef.takePictureAsync();

            console.log(photo)

            const uri = await ImageHelper.compressImage(photo.uri);
            addImageURI(uri);
            closeCamera()
        }
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        console.log(result);

        if (!result.cancelled) {
            const uri = await ImageHelper.compressImage(result.uri);
            addImageURI(uri);
            closeCamera()
        }
    };



    return (
        <SafeAreaView style={{ flex: 1, width: windowWidth, height: windowHeight, backgroundColor: 'black' }}>
            <View style={{ flex: 1 }}>
                <View style={cameraStyles.cameraButtonsContainer}>
                    <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }} onPress={closeCamera}>Back</Text>
                    <MaterialIcons name="flip-camera-ios" size={24} color="white" onPress={resetType} />
                </View>
            </View>
            <View style={{ height: windowWidth }}>
                <Camera style={{ height: windowWidth }} type={type} ref={ref => {
                    setCameraRef(ref) ;
                }}/>
            </View>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <View style={cameraStyles.cameraButtonsContainer}>
                    <MaterialIcons style={{ flex: 1 }} name="photo-library" size={30} color="white" onPress={pickImage} />
                    <TouchableOpacity style={{ flex: 1 }} onPress={takePhoto}>
                        <View>
                            <View style={{
                                borderWidth: 2,
                                borderRadius:"50%",
                                borderColor: 'white',
                                height: 50,
                                width:50,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'}}
                            >
                                <View style={{
                                    borderWidth: 2,
                                    borderRadius:"50%",
                                    borderColor: 'white',
                                    height: 40,
                                    width:40,
                                    backgroundColor: 'white'}} >
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const cameraStyles = StyleSheet.create({
    cameraBodyContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between'
    },
    cameraButtonsContainer: {
        height: 80,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'black',
    },
})