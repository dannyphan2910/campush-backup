import { useNavigation } from '@react-navigation/core';
import { Button, Divider, Input, Modal } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react'
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { UserContext } from '../context/user_context';
import { db, firebaseStorage } from '../firebase';
import { ImageHelper } from '../helper/helper';
import CameraView from './CameraView';
import { FontAwesome, Feather, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import firebase from "firebase";

const windowWidth = Dimensions.get('window').width;

export default function Product({ route }) {
    const { id } = route.params;
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [product, setProduct] = useState()

    const [editMode, setEditMode] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState(0)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [imageURI, setImageURI] = useState()

    const [refresh, setRefresh] = useState(true)

    useEffect(() => {
        const getProduct = () => {
            if (id && currentUser) {
                db.collection('products').doc(id).get()
                    .then((snapshot) => {
                        if (snapshot.exists) {
                            const product = snapshot.data()
                            setProduct(product)
                            setName(product.name)
                            setDescription(product.description)
                            setPrice(product.price.toString())
                            setImageURI(product.thumbnail_url)
                            setRefresh(false)
                        } else {
                            console.log('No product found for id ' + id)
                        }
                    })
            }
        }
        getProduct()
    }, [refresh])

    if (!product || !currentUser) {
        return null
    }

    const handleEdit = () => setEditMode(true)

    const handleBuy = () => {
        // const updates = {
        //     purchased_by: currentUser.username
        // }
        // db.ref('products').child(id).update(updates, err => {
        //     if (err) {
        //         Alert.alert('Purchase unsuccessful: ' + err)
        //     } else {
        //         db.ref('users_products').child(product.sold_by).child('active').orderByValue().equalTo(id).once('value',
        //             (snapshot) => {
        //                 if (snapshot.exists()) {
        //                     const key = Object.keys(snapshot.val())[0]
        //                     db.ref('users_products').child(product.sold_by).child('active').child(key).remove(err => {
        //                         if (!err) {
        //                             db.ref('users_products').child(product.sold_by).child('inactive').push(id)
        //                             db.ref('users_purchases').child(currentUser.username).push(id)
        //                             Alert.alert('Purchase successful')
        //                             navigation.navigate('Home')
        //                         } else {
        //                             console.log('No linking with users_products with id ' + id)
        //                         }
        //                     })
        //                 }
        //             }
        //         )
        //     }
        // })
        db.runTransaction((transaction) => {
            const productRef = db.collection('products').doc(id)

            const userCartRef = db.collection('users_carts').doc(currentUser.username)
            return transaction.get(userCartRef).then(snapshot => {
                if (!snapshot.exists) {
                    transaction.set(userCartRef, {
                        products: []
                    })
                }
                transaction.update(userCartRef, { products: firebase.firestore.FieldValue.arrayUnion(productRef) })
            })
        })
        .then(() => {
            Alert.alert('Added to Cart')
            navigation.navigate('Cart', { refresh: true })
        }).catch(err => console.error(err))

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
        db.collection('products').doc(id).update(updates)
            .then(() => { Alert.alert('Edit successfully'); setEditMode(false); setRefresh(true) })
            .catch(err => { Alert.alert('Edit unsuccessfully ' + err); console.error(err) })
    }

    const getButton = () => {
        if (product.purchased_by) {
            return <Button style={{ width: '50%', borderWidth: 0, borderRadius: 0 }} disabled>SOLD</Button>
        } else if (product.sold_by === currentUser.username) {
            if (!editMode) {
                return <Button style={{ width: '50%', backgroundColor: 'black', borderWidth: 0, borderRadius: 0 }} onPress={handleEdit}>EDIT</Button>
            }
        } else {
            return <Button style={{ width: '50%', backgroundColor: 'black', borderWidth: 0, borderRadius: 0 }} onPress={handleBuy}>BUY</Button>
        }
    }

    const goToChat = () => {
        if (product) {
            const params = {
                productId: product.id,
                sellerUsername: product.sold_by
            }
            navigation.navigate('Chat', params)
        }
    }

    const getView = () => {
        if (!editMode) {
            return (
                <ScrollView style={{ paddingHorizontal: 20 }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                    <Image style={{ width: windowWidth, height: windowWidth, alignSelf: 'center' }} source={{ uri: product.thumbnail_url }} />
                    <View style={{ paddingTop: 10}}>
                        <View style={{flexDirection: 'row',}}>
                            <View style={{flex: 5}}>
                                <Text style={styles.productInfoTitle}>{product.name}</Text>
                            </View>
                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <Text>53</Text>
                                <FontAwesome name="heart-o" size={24} color="black" style={{marginLeft: 10}}/>
                            </View>
                        </View>
                        <Divider style={{ color: 'black', marginVertical: 20}} />
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 5 }}>
                                <Text style={styles.productSoldBy}>{product.sold_by}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                {
                                    product.sold_by === currentUser.username ? 
                                    <View /> :
                                    <AntDesign name="message1" size={24} color="black" onPress={goToChat} />
                                }
                            </View>
                        </View>
                        <Text style={{fontSize: 16, }}>{product.description}</Text>
                    </View>
                </ScrollView>
            )
        } else {
            return (
                <KeyboardAvoidingView style={styles.container} keyboardVerticalOffset = {100}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            )
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 10 }}>
                {getView()}
            </View>
            <View style={{ flex: 1}}>
                {
                    editMode ? 
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="check" size={30} color="black" style={[styles.buttonStyle, { marginRight: 15, backgroundColor: '#C6D57E' }]} onPress={handleEditSave} />
                        <MaterialCommunityIcons name="cancel" size={30} color="black" style={[styles.buttonStyle, { marginLeft: 15, backgroundColor: '#D57E7E' }]} onPress={() => setEditMode(false)} />
                    </View> :
                    <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, borderTopColor: 'black', borderTopWidth: 0.4 }}>
                        <View style={{flex: 1, justifyContent: 'center'}}>
                            <Text style={styles.productInfoPrice}>$ {product.price}</Text>
                        </View>
                        <View style={{flex: 1, alignItems: 'flex-end', justifyContent: 'center'}}>
                            {getButton()}
                        </View>
                    </View>
                }
                
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    productInfoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    productInfoPrice: {
        fontSize: 20,
    },
    productSoldBy: {
        fontSize: 16,
        fontWeight: '500',
        paddingBottom: 15,
    },
    productInfoDetail: {
        fontSize: 24,
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
    buttonStyle: {
        width: 60, 
        height: 60, 
        borderRadius: 30,
        borderColor: 'grey', 
        borderWidth: 0.1, 
        textAlign: 'center', 
        paddingTop: 15, 
        overflow:'hidden'
    },
})