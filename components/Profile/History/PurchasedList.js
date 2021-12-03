import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { UserContext } from '../../../context/user_context'
import { db } from '../../../firebase'
import { GeneralHelper, UserHelper } from '../../../helper/helper'

export default function PurchasedList() {
    const { currentUser } = useContext(UserContext)

    const [purchasedProducts, setPurchaseProducts] = useState([])

    useEffect(() => {
        const getPurchasedProducts = () => {
            const username = UserHelper.getUsername(currentUser.email)
            db.ref('users_purchases').child(username).on('value',
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
                                setPurchaseProducts(productsFound)
                            }
                        )
                    } else {
                        console.log('No purchases found for username ' + username)
                    }
                }
            )
        }
        getPurchasedProducts()
    }, [])

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products listed. Create one now!</Text>
        </View>
    )

    const productsView = (
        <ScrollView>
            {GeneralHelper.getProductCardsLong(purchasedProducts)}
        </ScrollView>
    )

    const getProductCards = purchasedProducts.length > 0 ?
                            productsView :
                            noProductsView

    return (
        <SafeAreaView style={styles.container}>
            {getProductCards}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white'
    }
});