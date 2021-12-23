import React, { useContext, useEffect, useRef, useState } from 'react';
import { Animated, I18nManager, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProductHelper } from '../../helper/helper';
import { db } from '../../firebase';
import { UserContext } from '../../context/user_context';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons'; 
import firebase from "firebase";
import Loading from '../Loading';

export default function Favorites() {
    const { currentUser } = useContext(UserContext)

    const [favoritedProducts, setFavoritedProducts] = useState([])
    
    const [refresh, setRefresh] = useState(true)
    const [loading, setLoading] = useState(false)

    const swipeRefs = useRef([])
 
    useEffect(() => {
        const getUserProducts = () => {
            if (currentUser) {
                setLoading(true)
                db.collection('users_favorites').doc(currentUser.username).get()
                    .then(snapshot => {
                        if (snapshot.exists) {
                            const productsRefs = snapshot.get('products')
                            if (productsRefs) {
                                const productPromises = productsRefs.map((productRef) => {
                                    return productRef.get()
                                })
                                Promise.all(productPromises).then(productSnapshots => {
                                    const productsFound = productSnapshots.map(productSnapshot => productSnapshot.data())
                                    setFavoritedProducts(productsFound)
                                })
                            }
                        } else {
                            console.log('No favorited products found for username ' + currentUser.username)
                        }
                        setRefresh(false)
                    })  
                    .finally(() => setLoading(false))
            }
        }
        getUserProducts()
    }, [refresh])

    if (!currentUser) {
        return null
    }

    if (loading) {
        return <Loading />
    }

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products favorited. Like one now!</Text>
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

    const handleSwipeDelete = (index) => {
        setLoading(true)

        const product = favoritedProducts[index]

        db.runTransaction((transaction) => {
            const productRef = db.collection('products').doc(product.id)
            const userRef = db.collection('users').doc(currentUser.username)
    
            const userFavoritesRef = db.collection('users_favorites').doc(currentUser.username)
    
            transaction.update(userFavoritesRef, { products: firebase.firestore.FieldValue.arrayRemove(productRef) })
                .update(productRef, { favorited_by: firebase.firestore.FieldValue.arrayRemove(userRef) })

            return Promise.resolve()
        })
        .then(() => setRefresh(true))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }

    const productCards = ProductHelper.getProductCardsLong(favoritedProducts)
    const productCardsWithDelete = productCards.map((card, index) => (
        <Swipeable 
            ref={ref => swipeRefs.current[index] = ref}
            renderRightActions={renderRightActions}
            onSwipeableRightOpen={() => handleSwipeDelete(index)}
            key={favoritedProducts[index].id}
        >
            {card}
        </Swipeable>
    ))

    const productsView = (
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
            {productCardsWithDelete}
        </ScrollView>
    )

    const getProductCards = favoritedProducts.length > 0 ?
                            productsView :
                            noProductsView


    return (
        <SafeAreaView style={styles.container}>
            {getProductCards}
        </SafeAreaView>
    );
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
