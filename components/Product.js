import { useNavigation } from '@react-navigation/core';
import { Button, Divider, Input, Modal } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react'
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, SafeAreaView, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { UserContext } from '../context/user_context';
import { db, firebaseStorage } from '../firebase';
import { ImageHelper, UserHelper } from '../helper/helper';
import CameraView from './CameraView';

const windowWidth = Dimensions.get('window').width;

export default function Product({ route }) {
    const { id } = route.params;
    const { currentUser } = useContext(UserContext)
    const username = UserHelper.getUsername(currentUser.email)

    const navigation = useNavigation()

    const [product, setProduct] = useState()

    const [editMode, setEditMode] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState(0)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [imageURI, setImageURI] = useState()

    useEffect(() => {
        const getProduct = () => {
            if (id) {
                db.ref('products').child(id).on('value',
                    (snapshot) => {
                        if (snapshot.exists()) {
                            const product = snapshot.val()
                            setProduct(product)
                            setName(product.name)
                            setDescription(product.description)
                            setPrice(product.price.toString())
                            setImageURI(product.thumbnail_url)
                        } else {
                            console.log('No product found for id ' + id)
                        }
                    }
                )
            }
        }
        getProduct()
    }, [])

    if (!product) {
        return null
    }

    const handleEdit = () => setEditMode(true)

    const handleBuy = () => {
        const updates = {
            purchased_by: username
        }
        db.ref('products').child(id).update(updates, err => {
            if (err) {
                Alert.alert('Purchase unsuccessful: ' + err)
            } else {
                db.ref('users_products').child(product.sold_by).child('active').orderByValue().equalTo(id).once('value',
                    (snapshot) => {
                        if (snapshot.exists()) {
                            const key = Object.keys(snapshot.val())[0]
                            db.ref('users_products').child(product.sold_by).child('active').child(key).remove(err => {
                                if (!err) {
                                    db.ref('users_products').child(product.sold_by).child('inactive').push(id)
                                    db.ref('users_purchases').child(username).push(id)
                                    Alert.alert('Purchase successful')
                                    navigation.navigate('Home')
                                } else {
                                    console.log('No linking with users_products with id ' + id)
                                }
                            })
                        }
                    }
                )
            }
        })
    }

    const handleEditSave = async () => {
        let url = product.thumbnail_url
        if (imageURI !== url) {
            firebaseStorage.refFromURL(url).delete()
            url = await ImageHelper.uploadImageAsync(imageURI)
        }
        const updates = {
            name: name,
            description: description,
            price: parseFloat(price),
            thumbnail_url: url
        }
        db.ref('products').child(id).update(updates, err => {
            if (!err) {
                Alert.alert('Edit successfully')
            } else {
                Alert.alert('Edit unsuccessfully ' + err)
            }
        })
    }

    const handleDelete = () => {
        db.ref('products').child(id).remove()
        firebaseStorage.refFromURL(product.thumbnail_url).delete()
        db.ref('users_products').child(username).child('active').orderByValue().equalTo(id).once('value',
            (snapshot) => {
                if (snapshot.exists()) {
                    const key = Object.keys(snapshot.val())[0]
                    db.ref('users_products').child(username).child('active').child(key).remove(err => {
                        if (!err) {
                            Alert.alert('Remove product successfully')
                            navigation.navigate('Home')
                        } else {
                            console.log('No linking with users_products with id ' + id)
                        }
                    })
                }
            }
        )
    }

    const getButton = () => {
        if (product.purchased_by) {
            return <Button style={{ height: '100%', borderWidth: 0, borderRadius: 0 }} disabled>SOLD</Button>
        } else if (product.sold_by === username) {
            if (!editMode) {
                return <Button style={{ height: '100%' }} onPress={handleEdit}>EDIT</Button>
            } else {
                return (
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <Button style={{ height: '100%', flex: 1, backgroundColor: '#FF6962', borderWidth: 0, borderRadius: 0 }} onPress={handleDelete}>DELETE</Button>
                        <Button style={{ height: '100%', flex: 1, backgroundColor: '#77DF79', borderWidth: 0, borderRadius: 0 }}
                                onPress={() => {handleEditSave(); setEditMode(false); navigation.navigate('Home')}}>SAVE</Button>
                    </View>
                )
            }

        } else {
            return <Button style={{ height: '100%', borderWidth: 0, borderRadius: 0 }} onPress={handleBuy}>BUY</Button>
        }
    }

    const getView = () => {
        if (!editMode) {
            return (
                <View>
                    <Image style={{ width: windowWidth, height: windowWidth, alignSelf: 'center' }} source={{ uri: product.thumbnail_url }} />
                    <Text style={styles.productInfoTittle}>{product.name}</Text>
                    <Text style={styles.productInfoPrice}>$ {product.price}</Text>
                    <Text style={styles.productSoldBy}>sold by: {product.sold_by}</Text>
                    <Divider style={{ color: 'black' }} />
                    <Text style={{padding: 15, paddingBottom: 20, fontSize: 18, fontWeight: '500'}}>Product Detail</Text>
                    <Text style={{fontSize: 16, paddingHorizontal: 15}}>{product.description}</Text>
                </View>
            )
        } else {
            return (
                <View style={{ padding: 20 }}>
                    <Input
                        style={{ marginBottom: 10, backgroundColor: 'white' }}
                        onChangeText={setName}
                        value={name}
                    />
                    <Input
                        style={{ marginBottom: 10, backgroundColor: 'white' }}
                        onChangeText={setPrice}
                        value={price}
                        keyboardType="numeric"
                        accessoryLeft={() => <Text>$</Text>}
                    />
                    <Text style={styles.productSoldBy}>sold by: {product.sold_by}</Text>
                    <Divider style={{ color: 'black' }} />
                    <Text style={{padding: 15, paddingBottom: 20, fontSize: 18, fontWeight: '500'}}>Product Detail</Text>
                    <Input
                        style={{ backgroundColor: 'white' }}
                        multiline={true}
                        maxLength={200}
                        textStyle={{ minHeight: 64 }}
                        onChangeText={setDescription}
                        value={description}
                    />
                    <View style={{ alignItems: 'center' }}>
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
                    </View>
                </View>
            )
        }
    }

    return (
        <KeyboardAvoidingView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.container}>
                    <View style={{ flex: 10 }}>
                        <ScrollView>
                            {getView()}
                        </ScrollView>
                    </View>
                    <View style={{ flex: 1 }}>
                        {getButton()}
                    </View>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    productInfoTittle: {
        textAlign: 'center',
        fontSize: 22,
        paddingTop: 10,
        paddingHorizontal: 20,
        fontWeight: '500',
    },
    productInfoPrice: {
        fontWeight: '500',
        fontSize: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    productSoldBy: {
        fontSize: 16,
        fontWeight: '500',
        paddingHorizontal: 20,
        paddingBottom: 15,
        textAlign: 'center',
    },
    productInfoDetail: {
        fontSize: 24,
        paddingHorizontal: 20,
    },
    productInfoDescription: {
        paddingHorizontal: 20,
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
})