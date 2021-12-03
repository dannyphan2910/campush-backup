import { Button, Input, Modal, Text } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, SafeAreaView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { db } from '../../../firebase';
import { GeneralHelper, ImageHelper, UserHelper } from '../../../helper/helper';
import { UserContext } from '../../../context/user_context';
import { Camera } from 'expo-camera';
import { TouchableOpacity } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function SellProduct() {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState(0)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [imageURI, setImageURI] = useState()

    const handleSubmit = async (e) => {
        e.preventDefault()
        Keyboard.dismiss()
        const id = GeneralHelper.getRandomID()
        const username = UserHelper.getUsername(currentUser.email)
        // upload photo to Firebase Storage
        const url = await ImageHelper.uploadImageAsync(imageURI)
        // upload the new product to Firebase Realtime Database
        var product = {
            id: id,
            name: name,
            description: description,
            price: parseFloat(price),
            // favorited_by: [],
            thumbnail_url: url,
            sold_by: username,
            // purchased_by: null,
            created_at: Date.now()
        }
        db.ref('products').child(id).set(product, err => {
            if (err) {
                Alert.alert('Data could not be saved: ' + err)
            } else {
                db.ref('users_products').child(username).child('active').push(id)
                Alert.alert('Data saved successfully')
            }
        })
    }

    return (
        <KeyboardAvoidingView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ height: '100%', width: '100%', alignItems: 'center' }}>
                    <Input
                        style={styles.input}
                        onChangeText={setName}
                        placeholder="Name"
                    />
                    <Input
                        style={{ margin: 12, borderWidth: 1, padding: 10, backgroundColor: 'white' }}
                        multiline={true}
                        maxLength={200}
                        textStyle={{ minHeight: 64 }}
                        onChangeText={setDescription}
                        placeholder="Description (max 200 characters)"
                    />
                    <Input
                        style={styles.input}
                        onChangeText={setPrice}
                        placeholder="Price"
                        keyboardType="numeric"
                        accessoryLeft={() => <Text>$</Text>}
                    />
                    <Button
                        style={styles.button}
                        onPress={() => { Keyboard.dismiss(); setCameraOpen(true); }}
                        status='success'
                    >
                        {imageURI ? 'Re-add Photo' : 'Add Photo'}
                    </Button>
                    <Modal visible={cameraOpen} backdropStyle={{ backgroundColor: 'transparent'}}>
                        <CameraView closeCamera={() => setCameraOpen(false)} setImageURI={setImageURI} />
                    </Modal>
                    {imageURI && <Image style={styles.image} source={{ uri: imageURI }} />}
                    <Button
                        disabled={!(name && price && imageURI)}
                        style={styles.button}
                        onPress={e => { handleSubmit(e); navigation.navigate('SellDashboard'); }}
                        status='info'
                    >
                        Create Product
                    </Button>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

function CameraView({ closeCamera, setImageURI }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [cameraRef, setCameraRef] = useState(null)
    const [type, setType] = useState(Camera.Constants.Type.back);

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
            console.log('photo URI', photo.uri);
            console.log(photo)
            setImageURI(photo.uri)
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
            setImageURI(result.uri);
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

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        alignItems: 'center'
    },
    input: {
      height: 40,
      margin: 12,
      borderWidth: 1,
      padding: 10,
      backgroundColor: 'white'
    },
    button: {
        margin: 50,
        width: '50%'
    },
    image: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

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