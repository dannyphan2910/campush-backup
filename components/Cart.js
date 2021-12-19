import React, { useContext, useEffect, useRef, useState } from 'react'
import { Animated, I18nManager, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { UserContext } from '../context/user_context'
import { db } from '../firebase'
import { GeneralHelper } from '../helper/helper'
import { Feather } from '@expo/vector-icons'; 
import firebase from "firebase";

export default function Cart({ route }) {
    const { currentUser } = useContext(UserContext)

    const [cartProducts, setCartProducts] = useState([])
    const [refresh, setRefresh] = useState(true)

    const swipeRefs = useRef([])

    useEffect(() => {
        const getCartProducts = () => {
            if (currentUser) {
                db.collection('users_carts').doc(currentUser.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const productRefs = snapshot.get('products')
                            const productPromises = productRefs.map((productRef) => {
                                return productRef.get()
                            })
                            Promise.all(productPromises).then(productSnapshots => {
                                const productsFound = productSnapshots.map(productSnapshot => productSnapshot.data())
                                setCartProducts(productsFound)
                            })
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Your cart is empty. Add a product now!</Text>
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

    const cartProductCards = GeneralHelper.getProductCardsLong(cartProducts)
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

    const total = 0

    const productsView = (
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
            <View style={{ flex: 10 }}>
                {cartProductCardsWithRemove}
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

        </ScrollView>
    )

    const getProductCards = cartProducts.length > 0 ?
                            productsView :
                            noProductsView


    return (
        <SafeAreaView style={styles.container}>
            <Text style={{ padding: 20, fontSize: 28, fontWeight: '600' }}>My Cart</Text>
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
    }
});
