import { Card } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { DatabaseHelper, UserHelper } from '../../../helper/helper';
import { db } from '../../../firebase';
import { UserContext } from '../../../context/user_context';
import { useNavigation } from '@react-navigation/core';


export default function SellDashboard() {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    console.log('SELL DASHBOARD: ' + JSON.stringify(currentUser))
    const [userProducts, setUserProducts] = useState([])

    useEffect(() => {
        const getUserProducts = () => {
            const username = UserHelper.getUsername(currentUser.email)
            db.ref('users_products').child(username).child('active').on('value',
                (snapshot) => {
                    let productsFound = []
                    if (snapshot.exists()) {
                        const ids = Object.values(snapshot.val())
                        db.ref('products').orderByChild('created_at').once('value',
                            (querySnapshot) => {
                                querySnapshot.forEach((productSnapshot) => {
                                    if (ids.includes(productSnapshot.key)) {
                                        productsFound.push(productSnapshot.val())
                                    }
                                });
                                productsFound = productsFound.reverse()
                                setUserProducts(productsFound)
                            }
                        )
                    } else {
                        console.log('No products found for username ' + username)
                    }
                }
            )
        }
        getUserProducts()
    }, [])

    const userProductsCards = (products) => {
        return products.map((product, index) => {
            return (
                <Card style={styles.card} key={product.id} onPress={() => navigation.navigate('Product', { id: product.id })}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <View style={{ flex: 2, justifyContent: 'center' }}>
                            <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_url }} />
                        </View>
                        <View style={{ flex: 3, justifyContent: 'space-between' }}>
                            <Text>Name: {product.name}</Text>
                            <Text>Price: ${product.price}</Text>
                            <Text>
                                <Entypo name="heart" size={18} color="black" /> {product.favorited_by ? product.favorited_by.length : 0}
                            </Text>
                        </View>
                    </View>
                </Card>
            );
        })
    }

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products listed. Create one now!</Text>
        </View>
    )

    const productsView = (
        <ScrollView>
            {userProductsCards(userProducts)}
        </ScrollView>
    )

    const getProductCards = userProducts.length > 0 ?
                            productsView :
                            noProductsView


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {getProductCards}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    card: {
        margin: 5
    }
});
