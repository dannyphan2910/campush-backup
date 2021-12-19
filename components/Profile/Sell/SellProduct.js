import { Button, Input, Modal, Text } from '@ui-kitten/components';
import React, { useContext, useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { db } from '../../../firebase';
import { ImageHelper } from '../../../helper/helper';
import { UserContext } from '../../../context/user_context';
import CameraView from '../../CameraView'
import firebase from "firebase";

export default function SellProduct() {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState(0)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [imageURI, setImageURI] = useState()

    const handleSubmit = () => {
        Keyboard.dismiss()

        db.runTransaction(async (transaction) => {
            const productRef = db.collection('products').doc(id)

            // upload photo to Firebase Storage
            const url = await ImageHelper.uploadImageAsync(imageURI)
            // upload the new product to Firebase Realtime Database

            const productsRef = db.collection('products').doc()
            const id = productsRef.id
            const product = {
                id: id,
                name: name,
                description: description,
                price: parseFloat(price),
                // favorited_by: [],
                thumbnail_url: url,
                sold_by: currentUser.username,
                // purchased_by: null,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            }

            const userProductsRef = db.collection('users_products').doc(currentUser.username)
            return transaction.get(userProductsRef).then(snapshot => {
                transaction.set(productRef, product)

                if (!snapshot.exists) {
                    transaction.set(userProductsRef, {
                        active: []
                    })
                }
                transaction.update(userProductsRef, { active: firebase.firestore.FieldValue.arrayUnion(productRef) })
            })
        })
        .then(() => {
            navigation.navigate('SellDashboard', { refresh: true })
            Alert.alert('Data saved successfully')
        })
        .catch(err => { 
            Alert.alert('Data could not be saved: ' + err)
            console.error(err) 
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
                        onPress={handleSubmit}
                        status='info'
                    >
                        Create Product
                    </Button>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};


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