import { useNavigation } from '@react-navigation/core';
import { Button, Divider, Input, Modal, Text } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react'
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { UserContext } from '../context/user_context';
import { db, firebaseStorage } from '../firebase';
import { GeneralHelper, ImageHelper } from '../helper/helper';
import CameraView from './CameraView';
import { FontAwesome, Feather, MaterialCommunityIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import firebase from "firebase";

const windowWidth = Dimensions.get('window').width;

export default function Product({ route }) {
    const { id } = route.params;
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [product, setProduct] = useState()
    const [isFavorited, setIsFavorited] = useState(false)
    const [numInCart, setNumInCart] = useState(0) 
    const [isInCart, setIsInCart] = useState(false)

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
                const productRef = db.collection('products').doc(id)
                productRef.get().then((snapshot) => {
                        if (snapshot.exists) {
                            const product = snapshot.data()
                            setProduct(product)
                            setName(product.name)
                            setDescription(product.description)
                            setPrice(product.price.toString())
                            setImageURI(product.thumbnail_url)
                            const favorited = product.favorited_by
                                .map(userRef => userRef.id)
                                .includes(currentUser.username)
                            setIsFavorited(favorited)
                        } else {
                            console.log('No product found for id ' + id)
                        }
                        setRefresh(false)
                    })

                db.collection('users_carts').where('products', 'array-contains', productRef).get()
                    .then(snapshot => {
                        if (!snapshot.empty) {
                            setNumInCart(snapshot.size)
                        }
                    })

                db.collection('users_carts').doc(currentUser.username).get()
                    .then(snapshot => {
                        if (snapshot.exists) {
                            const productsRef = snapshot.get('products')
                            if (productsRef) {
                                const productIds = productsRef.map(ref => ref.id)
                                if (productIds.includes(id)) {
                                    setIsInCart(true)
                                } 
                            }
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

    const handleAddToCart = () => {
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

    const handleFavorite = async () => {
        db.runTransaction((transaction) => {
            const productRef = db.collection('products').doc(id)
            const userRef = db.collection('users').doc(currentUser.username)

            const userFavoritesRef = db.collection('users_favorites').doc(currentUser.username)

            const addFavorite = () => {
                transaction.update(userFavoritesRef, { products: firebase.firestore.FieldValue.arrayUnion(productRef) })
                    .update(productRef, { favorited_by: firebase.firestore.FieldValue.arrayUnion(userRef) })
            }

            const removeFavorite = () => {
                transaction.update(userFavoritesRef, { products: firebase.firestore.FieldValue.arrayRemove(productRef) })
                    .update(productRef, { favorited_by: firebase.firestore.FieldValue.arrayRemove(userRef) })
            }

            return transaction.get(userFavoritesRef).then(snapshot => {
                if (!snapshot.exists || !snapshot.get('products')) {
                    transaction.set(userFavoritesRef, {
                        products: []
                    })
                    addFavorite()
                } else {
                    const productsRef = snapshot.get('products')
                    if (productRef) {
                        const productIds = productsRef.map(ref => ref.id)
                        if (productIds.includes(id)) {
                            removeFavorite()
                        } else {
                            addFavorite()
                        }
                    }
                }
            })
        })
        .then(() => setRefresh(true))
        .catch(err => console.error(err))
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
        if (isInCart) {
            return <Button style={styles.actionButtonStyle} onPress={() => navigation.navigate('Cart')}>IN CART</Button>
        } else if (product.purchased_by) {
            return <Button style={[styles.actionButtonStyle, { backgroundColor: 'lightgray' }]} disabled>SOLD</Button>
        } else if (product.sold_by.id === currentUser.username) {
            if (!editMode) {
                return <Button style={styles.actionButtonStyle} onPress={handleEdit}>EDIT</Button>
            }
        } else {
            return <Button style={styles.actionButtonStyle} onPress={handleAddToCart}>ADD TO CART</Button>
        }
    }

    const goToChat = () => {
        if (product) {
            const params = {
                productId: product.id,
                sellerUsername: product.sold_by.id
            }
            navigation.navigate('Chat', params)
        }
    }

    const goToInboxFiltered = () => {
        if (product) {
            const params = {
                productId: product.id,
            }
            navigation.navigate('Inbox', params)
        }
    }

    const getView = () => {
        if (!editMode) {
            return (
                <ScrollView style={{ paddingHorizontal: 20 }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                    <Image style={{ width: windowWidth, height: windowWidth, alignSelf: 'center' }} source={{ uri: product.thumbnail_url }} />
                    <View style={{ paddingTop: 10 }}>
                        <View style={{flexDirection: 'row',}}>
                            <View style={{flex: 5}}>
                                <Text style={styles.productInfoTitle}>{product.name}</Text>
                            </View>
                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
                                <Text>{product.favorited_by.length}</Text>
                                {
                                    isFavorited ? 
                                    <FontAwesome name="heart" size={24} color="black" style={{marginLeft: 10}} onPress={handleFavorite} /> :
                                    <FontAwesome name="heart-o" size={24} color="black" style={{marginLeft: 10}} onPress={handleFavorite} />
                                }
                            </View>
                        </View>
                        <Divider style={{ color: 'black', marginVertical: 20 }} />
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 5 }}>
                                <Text style={styles.productSoldBy}>{product.sold_by.id}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                {
                                    product.sold_by.id === currentUser.username ? 
                                    <Feather name="inbox" size={24} color="black" onPress={goToInboxFiltered} /> :
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
                            <Text style={styles.productSoldBy}>sold by: {product.sold_by.id}</Text>
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
            <TouchableOpacity style={styles.floatingBtn}> 
                <Text style={{ marginRight: 8 }}>{numInCart}</Text>
                <Ionicons name="eye-outline" size={24} color="black" />
            </TouchableOpacity>
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
                            <Text style={styles.productInfoPrice}>${GeneralHelper.numberWithCommas(product.price)}</Text>
                        </View>
                        <View style={{ flex: 1, alignSelf: 'center', justifyContent: 'center' }}>
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
    floatingBtn: {                      
        position: 'absolute',                                         
        top: 10,                                                    
        right: 10, 
        backgroundColor: 'white',
        borderRadius: 25,
        borderWidth: 0.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignSelf: 'center'
    },
    actionButtonStyle: { 
        alignSelf: 'flex-end',
        backgroundColor: 'black', 
        borderWidth: 0, 
        borderRadius: 0 
    }
})