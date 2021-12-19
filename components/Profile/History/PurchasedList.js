import React, { useContext, useEffect, useState } from 'react'
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { UserContext } from '../../../context/user_context'
import { db } from '../../../firebase'
import { GeneralHelper } from '../../../helper/helper'

export default function PurchasedList() {
    const { currentUser } = useContext(UserContext)

    const [purchasedProducts, setPurchaseProducts] = useState([])
    const [refresh, setRefresh] = useState(true)

    useEffect(() => {
        const getPurchasedProducts = () => {
            if (currentUser) {
                db.collection('users_purchases').doc(currentUser.username).get()
                    .then(productRefs => {
                        if (productRefs.exists) {
                            const productPromises = productRefs.map((productRef) => {
                                return productRef.get()
                            })
                            Promise.all(productPromises).then(productSnapshots => {
                                const productsFound = productSnapshots.map(productSnapshot => productSnapshot.data()).reverse()
                                setPurchaseProducts(productsFound)
                            })
                        } else {
                            console.log('No purchases found for username ' + currentUser.username)
                        }
                        setRefresh(false)
                    })
            }
        }
        getPurchasedProducts()
    }, [refresh])

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products purchased. Buy one now!</Text>
        </View>
    )

    const productsView = (
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
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