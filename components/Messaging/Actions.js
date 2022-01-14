import * as Linking from 'expo-linking';
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'

import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native'
import { GeneralHelper, ImageHelper, ProductHelper } from '../../helper/helper'
import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/user_context';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../firebase';
import { Button, Card, Modal } from '@ui-kitten/components';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

async function warnPermission(permissionName) {
    Alert.alert(
        'Cannot be done 😞',
        `If you would like to use this feature, you'll need to enable the ${permissionName} permission in your phone settings.`,
        [
            {
                text: "Go To Settings!",
                onPress: () => Linking.openURL('app-settings:'),
            },
            { 
                text: 'Nevermind', 
                style: 'cancel' 
            },
        ],
        { cancelable: true },
    )
}

export async function getLocationAsync(onSend, currentUser) {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({})
        if (location) {
            onSend([
                { 
                    _id: GeneralHelper.getRandomID(),
                    location: location.coords,
                    type: 'location',
                    createdAt: Date.now(),
                    user: {
                        _id: currentUser.username,
                        name: `${currentUser.first_name} ${currentUser.last_name}`,
                        avatar: currentUser.avatar_url,
                    }
                }
            ])
        }
    } else {
        await warnPermission('Location')
    }
}

export async function pickImageAsync(onSend, currentUser) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status === 'granted') {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
        })

        if (!result.cancelled) {
            const uri = await ImageHelper.compressImage(result.uri);
            onSend([
                { 
                    _id: GeneralHelper.getRandomID(),
                    image: uri,
                    type: 'image',
                    createdAt: Date.now(),
                    user: {
                        _id: currentUser.username,
                        name: `${currentUser.first_name} ${currentUser.last_name}`,
                        avatar: currentUser.avatar_url,
                    }
                }
            ])
            return uri
        }
    } else {
        await warnPermission('Photo Library')
    }
}

export async function takePictureAsync(onSend, currentUser) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
        })

        if (!result.cancelled) {
            const uri = await ImageHelper.compressImage(result.uri);
            onSend([
                { 
                    _id: GeneralHelper.getRandomID(),
                    image: uri,
                    type: 'image',
                    createdAt: Date.now(),
                    user: {
                        _id: currentUser.username,
                        name: `${currentUser.first_name} ${currentUser.last_name}`,
                        avatar: currentUser.avatar_url,
                    }
                }
            ])
            return uri
        }
    } else {
        await warnPermission('Camera')
    }
}

export default function SellerProductsModal({ visible, setVisible, sellerUsername, onSend }) {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [products, setProducts] = useState([])
    const [chosen, setChosen] = useState()

    useEffect(() => {
        db.collection('users_products').doc(sellerUsername)
            .onSnapshot(snapshot => {
                if (snapshot.exists) {
                    const activeProductsRefs = snapshot.get('active')
                    if (activeProductsRefs) {
                        const productPromises = activeProductsRefs.map((productRef) => {
                            return productRef.get()
                        })
                        Promise.all(productPromises).then(productSnapshots => {
                            const productsFound = productSnapshots.map(productSnapshot => {
                                let data = productSnapshot.data()
                                data = {
                                    ...data,
                                    favorited_by: data.favorited_by.map((obj, ind) => ind)
                                }
                                return data
                            }).reverse()
                            setProducts(productsFound)
                        })
                    }
                } else {
                    console.log('No active products found for username ' + sellerUsername)
                }
            })
    }, [])

    const handleConfirm = () => {
        setVisible(false)
        onSend([
            { 
                _id: GeneralHelper.getRandomID(),
                product: chosen,
                createdAt: Date.now(),
                user: {
                    _id: currentUser.username,
                    name: `${currentUser.first_name} ${currentUser.last_name}`,
                    avatar: currentUser.avatar_url,
                }
            }
        ])
    }

    const handleCardPress = (product) => {
        if (chosen && product.id === chosen.id) {
            setChosen(undefined)
        } else {
            setChosen(product)
        }
    }

    const handleCardLongPress = (product) => {
        setVisible(false)
        navigation.navigate('Product', { id: product.id })
    }

    let productCards = ProductHelper.getProductCardsLong(products, {}, handleCardPress, handleCardLongPress)
    productCards = productCards.map((card, index) => (
        <Pressable 
            key={products[index].id}
            style={{ backgroundColor: (chosen && (chosen.id === products[index].id)) ? 'lightgray' : 'white' }}
        >
            {card}
        </Pressable>
    ))

    const cancel = () => {
        setVisible(false)
        setChosen(undefined)
    }

    return (
        <Modal visible={visible} backdropStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onBackdropPress={cancel}>
            <Card>
                <View style={{ flex: 1, width: windowWidth*0.8, height: windowHeight*0.5 }}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 5 }}>REFERENCE A PRODUCT</Text>
                        <Text style={{ fontSize: 15, fontWeight: '400' }}>Found {productCards.length} Products By {sellerUsername}</Text>
                    </View>
                    <View style={{ flex: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
                        <ScrollView style={{ width: '100%' }}>
                            {productCards}
                        </ScrollView>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                        <View style={{ flex: 1 }}>
                            <Button
                                disabled={!chosen}
                                style={[styles.button, { width: '75%' }]}
                                onPress={handleConfirm}
                                status='info'
                            >
                                CONFIRM
                            </Button>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Button
                                style={[styles.button, { width: '75%' }]}
                                onPress={cancel}
                                status='info'
                            >
                                CANCEL
                            </Button>
                        </View>
                    </View>
                </View>
            </Card>
        </Modal>
    )
}

const styles = StyleSheet.create({
    button: {
        alignSelf: 'center',
        backgroundColor: 'black',
        borderWidth: 0,
        borderRadius: 5
    },
});