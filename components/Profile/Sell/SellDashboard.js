import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Animated, I18nManager, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProductHelper } from '../../../helper/helper';
import { db, firebaseStorage } from '../../../firebase';
import { UserContext } from '../../../context/user_context';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons'; 
import firebase from "firebase";
import Loading from '../../Loading';

export default function SellDashboard({ route }) {
    const { currentUser } = useContext(UserContext)

    const [userProducts, setUserProducts] = useState([])

    const [refresh, setRefresh] = useState(true)
    const [loading, setLoading] = useState(false)

    const swipeRefs = useRef([])
 
    useEffect(() => {
        const getUserProducts = () => {
            if (currentUser) {
                setLoading(true)
                db.collection('users_products').doc(currentUser.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const activeProductsRefs = snapshot.get('active')
                            if (activeProductsRefs) {
                                const productPromises = activeProductsRefs.map((productRef) => {
                                    return productRef.get()
                                })
                                Promise.all(productPromises).then(productSnapshots => {
                                    const productsFound = productSnapshots.map(productSnapshot => productSnapshot.data()).reverse()
                                    setUserProducts(productsFound)
                                })
                            }
                        } else {
                            console.log('No active products found for username ' + currentUser.username)
                        }
                        setRefresh(false)
                    })
                setLoading(false)
            }
        }
        getUserProducts()
    }, [route, refresh])

    if (!currentUser) {
        return null
    }

    if (loading) {
        return <Loading />
    }

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products listed. Create one now!</Text>
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

    const handleDelete = (index) => {
        setLoading(true)

        const product = userProducts[index]
        
        db.runTransaction((transaction) => {
            const userProductsRef = db.collection('users_products').doc(currentUser.username)
            const productRef = db.collection('products').doc(product.id)

            return db.collection('users_carts').where('products', 'array-contains', productRef).get().then(querySnapshot => {
                // remove this product from the carts of ALL users
                if (!querySnapshot.empty) {
                    querySnapshot.docs.forEach(ref => {
                        const cartRef = db.collection('users_carts').doc(ref.id)
                        console.log(cartRef.path)
                        transaction.update(cartRef, { products: firebase.firestore.FieldValue.arrayRemove(productRef) })
                    })
                }
                // remove this product from the list of ALL products
                transaction.delete(productRef)
                // remove this product from the list of ACTIVE products of THIS user
                transaction.update(userProductsRef, { active: firebase.firestore.FieldValue.arrayRemove(productRef) })      
                // remove the attached thumbnail images from the storage
                product.thumbnail_urls.forEach(url => firebaseStorage.refFromURL(url).delete())
            })
        })
        .then(() => { Alert.alert('Remove product successfully') })
        .catch(err => { Alert.alert('Data could not be removed: ' + err); console.error(err) })
        .finally(() => setLoading(false))
    }

    const handleSwipeDelete = (index) => {
        const product = userProducts[index]

        Alert.alert(
            'Are you sure?', 
            'Please confirm your deletion of "' + product.name + '".',     
            [
                {
                    text: "Cancel",
                    onPress: () => swipeRefs.current[index].close(),
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => handleDelete(index),
                    style: "destructive",
                },
            ],
            {
                cancelable: true,
            }
        )
    }

    const productCards = ProductHelper.getProductCardsLong(userProducts)
    const productCardsWithDelete = productCards.map((card, index) => (
        <Swipeable 
            ref={ref => swipeRefs.current[index] = ref}
            renderRightActions={renderRightActions}
            onSwipeableRightOpen={() => handleSwipeDelete(index)}
            key={userProducts[index].id}
        >
            {card}
        </Swipeable>
    ))

    const productsView = (
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
            {productCardsWithDelete}
        </ScrollView>
    )

    const getProductCards = userProducts.length > 0 ?
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
