import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GeneralHelper, UserHelper } from '../../../helper/helper';
import { db } from '../../../firebase';
import { UserContext } from '../../../context/user_context';

export default function SellDashboard() {
    const { currentUser } = useContext(UserContext)

    // console.log('SELL DASHBOARD: ' + JSON.stringify(currentUser))
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

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products listed. Create one now!</Text>
        </View>
    )

    const productsView = (
        <ScrollView>
            {GeneralHelper.getProductCardsLong(userProducts)}
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
    }
});
