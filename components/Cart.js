import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/core';
import { Alert, Animated, Dimensions, I18nManager, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { UserContext } from '../context/user_context'
import { db } from '../firebase'
import { CartHelper, ProductHelper } from '../helper/helper'
import { Feather, FontAwesome5 } from '@expo/vector-icons'; 
import firebase from "firebase";
import { Button, Card, Divider, Modal } from '@ui-kitten/components'

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function Cart({ route }) {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [cartProducts, setCartProducts] = useState([])
    const [inactiveProducts, setInactiveProducts] = useState([])
    const [refresh, setRefresh] = useState(true)

    const [visibleInactiveCard, setVisibleInactiveCard] = useState(false)

    const swipeRefs = useRef([])

    useEffect(() => {
        const getCartProducts = () => {
            if (currentUser) {
                db.collection('users_carts').doc(currentUser.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const productRefs = snapshot.get('products')
                            if (productRefs) {
                                const productPromises = productRefs.map((productRef) => {
                                    return productRef.get()
                                })
                                Promise.all(productPromises).then(productSnapshots => {
                                    const productsFound = productSnapshots.map(productSnapshot => productSnapshot.data())
                                    const activeProducts = productsFound.filter(p => !p.purchased_by)
                                    const inactiveProducts = productsFound.filter(p => p.purchased_by)
                                    setCartProducts(activeProducts)
                                    setInactiveProducts(inactiveProducts)
                                })
                            }
                        } else {
                            console.log('No products in cart found for username ' + currentUser.username)
                        }
                        setRefresh(false)
                    })
            }
        }
        getCartProducts()
    }, [route, refresh])

    const noProductsView = (
        <View style={{ flex: 10 }}>
            <ScrollView contentContainerStyle={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Your cart is empty. Add a product now!</Text>
                </View>
            </ScrollView>
        </View>
    )

    const renderRightActions = (progress, dragX) => {
        const scale = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        })

        return (
          <TouchableOpacity style={styles.rightAction}>
                <Animated.Text
                    style={{
                        color: 'white',
                        paddingHorizontal: 20,
                        fontWeight: '600',
                        transform: [{ scale }]
                    }}>
                    <Feather name="trash-2" size={30} color="white" />
                </Animated.Text>
          </TouchableOpacity>
        );
    };

    const handleRemoveFromCart = (index) => {
        const product = cartProducts[index]

        const productRef = db.collection('products').doc(product.id)

        db.collection('users_carts').doc(currentUser.username)
            .update({ products: firebase.firestore.FieldValue.arrayRemove(productRef) })
            .then(() => setRefresh(true))
            .catch(err => console.error(err))
    }

    const handleCheckout = () => {
        if (!currentUser.has_payment) {
            Alert.alert('Missing Payment Method', 'Please add a payment method before proceeding')
            navigation.navigate('Payment')
        } else {
            // initialize list of purchases for this user (if necessary)
            db.collection('users_purchases').doc(currentUser.username).get().then(snapshot => {
                if (!snapshot.exists || !snapshot.get('products')) {
                    db.collection('users_purchases').doc(snapshot.id).set({
                        products: []
                    })
                }
            })
            // initialize list of INACTIVE products for the seller (if necessary)
            db.collection('users_products').doc(currentUser.username).get().then(snapshot => {
                if (!snapshot.exists || !snapshot.get('inactive')) {
                    db.collection('users_products').doc(snapshot.id).set({
                        inactive: []
                    })
                }
            })
            
            db.runTransaction((transaction) => {
                // perform these operations for EACH product in the cart
                return Promise.all(cartProducts.map((product) => {
                    const productRef = db.collection('products').doc(product.id)
                    const userPurchasesRef = db.collection('users_purchases').doc(currentUser.username)
                    const currentUserRef = db.collection('users').doc(currentUser.username)
                    const sellerProductsRef = db.collection('users_products').doc(product.sold_by.id)
                    const cartRef = db.collection('users_carts').doc(currentUser.username)

                    // add the 'purchased_by' field to this product
                    transaction.update(productRef, { 
                        purchased_by: currentUserRef, 
                        purchased_at: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    // add this product to the list of purchases of this user
                    transaction.update(userPurchasesRef, { products: firebase.firestore.FieldValue.arrayUnion(productRef) })
                    // remove this product from the list of ACTIVE products of the seller
                    transaction.update(sellerProductsRef, { active: firebase.firestore.FieldValue.arrayRemove(productRef) })
                    // add this product to the list of INACTIVE products of the seller
                    transaction.update(sellerProductsRef, { inactive: firebase.firestore.FieldValue.arrayUnion(productRef) })
                    // clear this product from the cart of this user
                    transaction.update(cartRef, { products: firebase.firestore.FieldValue.arrayRemove(productRef) })
                }))
            })
            .then(() => {
                Alert.alert('Purchased succesfully!')
                navigation.navigate('Purchased', { refresh: true })
            }).catch(err => {
                Alert.alert('Unsuccessful purchases: ' + err)
                console.error(err)
            })
        }
    }

    const handleClearInactive = () => {
        db.runTransaction((transaction) => {
            // perform these operations for EACH product in the cart
            return Promise.all(inactiveProducts.map((product) => {
                const productRef = db.collection('products').doc(product.id)
                const cartRef = db.collection('users_carts').doc(currentUser.username)
                // clear this product from the cart of this user
                transaction.update(cartRef, { products: firebase.firestore.FieldValue.arrayRemove(productRef) })
            }))
        })
        .then(() => setRefresh(true))
        .catch(err => console.error(err))
    }

    const inactiveProductCards = ProductHelper.getProductCardsLong(inactiveProducts)
    const cartProductCards = ProductHelper.getProductCardsLong(cartProducts)
    const cartProductCardsWithRemove = cartProductCards.map((card, index) => (
        <Swipeable 
            ref={ref => swipeRefs.current[index] = ref}
            renderRightActions={renderRightActions}
            onSwipeableRightOpen={() => handleRemoveFromCart(index)}
            key={cartProducts[index].id}
        >
            {card}
        </Swipeable>
    ))

    const { subtotal, fees, total } = CartHelper.getTotalCost(cartProducts)

    const productsView = (
        <View style={{ flex: 10 }}>
            <View style={{ flex: 6, paddingTop: 15 }}>
                <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                    {cartProductCardsWithRemove}
                </ScrollView>
            </View>
            <View style={{ flex: 3, borderTopWidth: 1 }}>
                <View style={{ flex: 3, padding: 15, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.title}><Text style={{ fontWeight: '300' }}>SUBTOTAL</Text></View>
                        <View style={styles.cost}><Text>${subtotal}</Text></View>
                    </View>
                    <View style={{ flexDirection: 'row', marginVertical: 10 }}>
                        <View style={styles.title}><Text style={{ fontWeight: '300' }}>TAXES &#38; FEES</Text></View>
                        <View style={styles.cost}><Text>${fees}</Text></View>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.title}><Text style={{ fontWeight: 'bold' }}>TOTAL</Text></View>
                        <View style={styles.cost}><Text>${total}</Text></View>
                    </View>
                </View>
                <Divider />
                <View style={{ flex: 2, padding: 10 }}>
                    <Button style={styles.checkoutBtn} onPress={handleCheckout}>PROCEED TO CHECKOUT</Button>
                </View>
            </View>
        </View>
    )

    const getProductCards = cartProducts.length > 0 ?
                            productsView :
                            noProductsView

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1, paddingTop: 20, paddingHorizontal: 20, flexDirection: 'row' }}>
                <View style={{ flex: 6, alignItems: 'flex-start', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '600' }}>My Cart</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                    {
                        inactiveProducts.length > 0 &&
                        <View>
                            <FontAwesome5 name="exclamation-circle" size={24} color="crimson" onPress={() => setVisibleInactiveCard(true)} />
                            <Modal visible={visibleInactiveCard} backdropStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onBackdropPress={() => setVisibleInactiveCard(false)}>
                                <Card>
                                    <View style={{ flex: 1, width: windowWidth*0.8, height: windowHeight*0.5 }}>
                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 5 }}>OUT-OF-STOCK PRODUCTS</Text>
                                            <Text style={{ fontSize: 15, fontWeight: '400' }}>Found {inactiveProductCards.length} Products In Your Cart</Text>
                                        </View>
                                        <View style={{ flex: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
                                            <ScrollView style={{ width: '100%' }}>
                                                {inactiveProductCards}
                                            </ScrollView>
                                        </View>
                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                            <Button
                                                style={styles.button}
                                                onPress={handleClearInactive}
                                                status='info'
                                            >
                                                CLEAR ALL
                                            </Button>
                                        </View>
                                    </View>
                                </Card>
                            </Modal>
                        </View>
                    }
                </View>
            </View>
            {getProductCards}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white'
    },
    rightAction: {
        alignItems: 'center',
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        backgroundColor: '#dd2c00',
        flex: 1,
        justifyContent: 'flex-end'
    },
    checkoutBtn: {
        backgroundColor: 'black',
        borderWidth: 0
    },
    title: { 
        flex: 2, 
        justifyContent: 'center', 
        alignItems: 'flex-start', 
    },
    cost: { 
        flex: 4, 
        justifyContent: 'center', 
        alignItems: 'flex-end',
    },
    button: {
        alignSelf: 'center',
        backgroundColor: 'black',
        borderWidth: 0,
        borderRadius: 5
    },
});
