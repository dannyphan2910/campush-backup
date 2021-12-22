import { useNavigation } from '@react-navigation/core';
import { Card, Divider, Layout } from '@ui-kitten/components';
import { Feather, FontAwesome, AntDesign } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, StatusBar, Dimensions, Pressable } from 'react-native';
import { UserContext } from '../context/user_context';
import { db } from '../firebase';
import CachedImage from './CachedImage';
import firebase from "firebase";
import SwipeCards from "react-native-swipe-cards-deck"

const windowWidth = Dimensions.get('window').width;

export default function Home() {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [featuredProducts, setFeatureProducts] = useState([])
    const [numFavorites, setNumFavorites] = useState(0)

    const [refresh, setRefresh] = useState(true)

    useEffect(() => {
        const getProducts = () => {
            db.collection('products').get()
                .then(
                    (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            let products = []
                            querySnapshot.forEach((productSnapshot) => {
                                // var random_boolean = Math.random() < 0.5;
                                // if (!productSnapshot.get('purchased_by')) {
                                //     if (random_boolean) {
                                        const product = productSnapshot.data();
                                        products.push(product)
                                //     }
                                // }
                            });
                            setFeatureProducts(products)
                        } else {
                            console.log('No products found')
                        }
                        setRefresh(false)
                    }
                )
                .catch(err => console.error(err))
        }

        const getFavoritesCount = () => {
            if (currentUser) {
                db.collection('users_favorites').doc(currentUser.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const favoritesRef = snapshot.get('products')
                            if (favoritesRef) setNumFavorites(favoritesRef.length)
                        }
                    })
            }
        }

        getProducts()
        getFavoritesCount()
    }, [refresh])

    if (!currentUser) {
        return null
    }

    const getDeckCard = (product) => {
        const borderRadius = 15

        return (
            <Pressable 
                onLongPress={() => navigation.navigate('Product', { id: product.id })}
                style={{ backgroundColor: 'white', borderRadius: borderRadius, borderWidth: 1 }} 
                key={product.id}>    
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <CachedImage 
                        style={{ width: windowWidth * 0.9, height: windowWidth * 0.9, borderTopRightRadius: borderRadius, borderTopLeftRadius: borderRadius }} 
                        source={{ uri: product.thumbnail_urls[0] }} />
                </View>
                <Divider />
                <View style={{ padding: 20, flexDirection: 'row' }}>
                    <View style={{ flex: 5 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{product.name}</Text>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{product.sold_by.id}</Text>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Text>{product.favorited_by.length}</Text>
                        <FontAwesome name="heart" size={24} color="black" style={{ marginLeft: 10 }} />
                    </View>
                </View>
            </Pressable>
        )
    }

    const handleSwipeRight = async (id) => {
        db.runTransaction((transaction) => {
            const productRef = db.collection('products').doc(id)
            const userRef = db.collection('users').doc(currentUser.username)

            const userFavoritesRef = db.collection('users_favorites').doc(currentUser.username)

            const addFavorite = () => {
                transaction.update(userFavoritesRef, { products: firebase.firestore.FieldValue.arrayUnion(productRef) })
                    .update(productRef, { favorited_by: firebase.firestore.FieldValue.arrayUnion(userRef) })
            }

            return transaction.get(userFavoritesRef).then(snapshot => {
                if (!snapshot.exists || !snapshot.get('products')) {
                    transaction.set(userFavoritesRef, {
                        products: []
                    }) 
                } 
                addFavorite()
            })
        })
        .then(() => console.log('Added to favorites'))
        .catch(err => console.error(err))
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={{ flex: 1, paddingTop: 20, paddingHorizontal: 20, flexDirection: 'row' }}>
                <View style={{ flex: 6, alignItems: 'flex-start', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '600' }}>Hello, {currentUser.first_name} {currentUser.last_name}!</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Feather name="inbox" size={24} color="black" onPress={() => navigation.navigate('Inbox')} />
                </View>
            </View>
            <View style={{ flex: 10, paddingHorizontal: 20 }}>
                <View style={styles.body}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 5, justifyContent: 'center', alignItems: 'flex-start' }}>
                            <Text style={styles.header_font}>Featured Products</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
                            <Feather name="refresh-ccw" size={22} color="black" onPress={() => setRefresh(true)} />
                        </View>
                    </View>
                </View>
                <View style={styles.bodyContainer}>
                    <SwipeCards
                        cards={featuredProducts}
                        renderCard={(product) => getDeckCard(product)}
                        keyExtractor={(cardData) => cardData.text}
                        loop={true}
                        renderNoMoreCards={() => (
                            <Card>
                                <Text style={{ fontSize: 24, fontWeight: '500', textAlign: 'center' }}>No Suggested Products Left...</Text>
                                <Text style={{ fontSize: 24, fontWeight: '500', textAlign: 'center' }}>Try refreshing!</Text>
                            </Card>
                        )}
                        dragY={false}
                        actions={{
                            nope: { 
                                onAction: (product) => { return true }, 
                                text: <AntDesign name="dislike2" size={24} color="red" />,
                            },
                            yup: { 
                                onAction: (product) => { handleSwipeRight(product.id); return true }, 
                                text: <AntDesign name="like2" size={24} color="green" /> 
                            },
                        }}
                        stack={true}
                        stackOffsetX={0}
                        stackDepth={2}
                        />
                </View>
                <View style={{ flex: 2, marginBottom: 20 }}>
                    <Pressable 
                        onPress={() => navigation.navigate('Favorites')}
                        style={{ flex: 1, flexDirection: 'row', borderWidth: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center', padding: 20 }} >
                        <View style={{ flex: 5 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600' }}>GO TO YOUR FAVORITES ({numFavorites})</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Feather name="arrow-right-circle" size={24} color="black" />
                        </View>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyContainer: {
        flex: 12,
    },
    body: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        flex: 1, 
        width: '100%'
    },
    header_font: {
        fontWeight: '600',
        fontSize: 22,
    },
    product_font: {
        // fontFamily: 'San Francisco',
        fontSize: 16,
        // padding: 5
    },
    seller_font: {
        fontSize: 10,
        // padding: 5
    }
});
