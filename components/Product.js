import { useNavigation } from '@react-navigation/core';
import { Button, Divider, Text } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react'
import { Alert, Dimensions, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { UserContext } from '../context/user_context';
import { db } from '../firebase';
import { GeneralHelper } from '../helper/helper';
import { FontAwesome, Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import firebase from "firebase";
import CachedImage from './CachedImage';
import { FlatList } from 'react-native-gesture-handler';

const windowWidth = Dimensions.get('window').width;

export default function Product({ route }) {
    const { id } = route.params;
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [product, setProduct] = useState()
    const [isFavorited, setIsFavorited] = useState(false)
    const [numInCart, setNumInCart] = useState(0) 
    const [isInCart, setIsInCart] = useState(false)

    const [refresh, setRefresh] = useState(true)

    useEffect(() => {
        const getProduct = () => {
            if (id && currentUser) {
                const productRef = db.collection('products').doc(id)
                productRef.get().then((snapshot) => {
                        if (snapshot.exists) {
                            const product = snapshot.data()
                            setProduct(product)
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
    }, [route, refresh])

    if (!product || !currentUser) {
        return null
    }

    const handleEdit = () => navigation.navigate('SellProduct', { isEditMode: true, product: product })

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

    const getButton = () => {
        if (isInCart) {
            return <Button style={styles.actionButtonStyle} onPress={() => navigation.navigate('Cart')}>IN CART</Button>
        } else if (product.purchased_by) {
            return <Button style={[styles.actionButtonStyle, { backgroundColor: 'lightgray' }]} disabled>SOLD</Button>
        } else if (product.sold_by.id === currentUser.username) {
            return <Button style={styles.actionButtonStyle} onPress={handleEdit}>EDIT</Button>
        } else {
            return <Button style={styles.actionButtonStyle} onPress={handleAddToCart}>ADD TO CART</Button>
        }
    }

    const goToChat = () => {

        // const navigateToConversation = () => {
        //     const productRef = db.collection('products').doc(product.id)
        //     const sellerRef = db.collection('users').doc(product.sold_by.id)
        //     const userRef = db.collection('users').doc(currentUser.username)

        //     db.collection('conversations')
        //         .where('details.product', '==', productRef)
        //         .where('details.sold_by', '==', sellerRef)
        //         .where('details.asked_by', '==', userRef)
        //         .limit(1)
        //         .get()
        //         .then(querySnapshot => {
        //             if (!querySnapshot || querySnapshot.empty) {
        //                 const convoRef = db.collection('conversations').doc()
        //                 const body = {
        //                     id: convoRef.id,
        //                     details: {
        //                         product: productRef,
        //                         sold_by: sellerRef,
        //                         asked_by: userRef
        //                     },
        //                     messages: []
        //                 }
                        
        //                 navigation.navigate('Chat', { conversationInfo: body })
        //             } else if (querySnapshot.size == 1) {
        //                 querySnapshot.forEach(convoSnapshot => {
        //                     if (convoSnapshot) {
        //                         convoSnapshot.data
        //                     }
        //                 })
        //             } else {
        //                 console.error('Found multiple conversations: ', querySnapshot.docs.map(doc => doc.id))
        //             }
        //         })
        // }

        if (product) {
            navigation.navigate('Chat', { productId: id, sellerUsername: product.sold_by.id })
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
        return (
            <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                <TouchableOpacity style={styles.floatingBtn}> 
                    <Text style={{ marginRight: 8 }}>{numInCart}</Text>
                    <Ionicons name="eye-outline" size={24} color="black" />
                </TouchableOpacity>
                <FlatList
                    pagingEnabled
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    data={product.thumbnail_urls}
                    getItemLayout={(data, index) => ({ length: windowWidth, offset: windowWidth*index, index })}
                    keyExtractor={({ item, index }) => index}
                    renderItem={({ item, index }) => (
                        <CachedImage style={{ width: windowWidth, height: windowWidth, alignSelf: 'center' }} source={{ uri: item }} key={index} />
                    )}
                />
                <View style={{ paddingTop: 10, paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                        <View style={{ flex: 5 }}>
                            <View style={{ flex: 1 }}><Text style={styles.productInfoTitle}>{product.name}</Text></View>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Text>{product.favorited_by.length}</Text>
                            {
                                isFavorited ? 
                                <FontAwesome name="heart" size={24} color="black" style={{marginLeft: 10}} onPress={handleFavorite} /> :
                                <FontAwesome name="heart-o" size={24} color="black" style={{marginLeft: 10}} onPress={handleFavorite} />
                            }
                        </View>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}><Text style={styles.title}>Condition: </Text><Text>{product.condition}</Text></View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}><Text style={styles.title}>Brand: </Text><Text>{product.brand}</Text></View>
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
                    <Text style={{ fontSize: 16 }}>{product.description}</Text>
                </View>
            </ScrollView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 10 }}>
                {getView()}
            </View>
            <View style={{ flex: 1}}>
                <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, borderTopColor: 'black', borderTopWidth: 0.4 }}>
                    <View style={{flex: 1, justifyContent: 'center'}}>
                        <Text style={styles.productInfoPrice}>${GeneralHelper.numberWithCommas(product.price)}</Text>
                    </View>
                    <View style={{ flex: 1, alignSelf: 'center', justifyContent: 'center' }}>
                        {getButton()}
                    </View>
                </View>
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
        alignSelf: 'center',
        zIndex: 10
    },
    actionButtonStyle: { 
        alignSelf: 'flex-end',
        backgroundColor: 'black', 
        borderWidth: 0, 
        borderRadius: 5
    },
    title: {
        fontSize: 15,
        color: 'grey',
    },
})