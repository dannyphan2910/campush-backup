import React, { useContext, useEffect, useState } from 'react'
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { UserContext } from '../../../context/user_context'
import { db } from '../../../firebase'
import { ProductHelper } from '../../../helper/helper'
import Loading from '../../Loading'

export default function PurchasedList({ route }) {
    const { currentUser } = useContext(UserContext)

    const [purchasedProducts, setPurchaseProducts] = useState([])

    const [refresh, setRefresh] = useState(true)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const getPurchasedProducts = () => {
            if (currentUser) {
                setLoading(true)
                db.collection('users_purchases').doc(currentUser.username).get()
                    .then(snapshot => {
                        if (snapshot.exists) {
                            const productsRef = snapshot.get('products')
                            if (productsRef) {
                                const productPromises = productsRef.map((productRef) => {
                                    return productRef.get()
                                })
                                Promise.all(productPromises).then(productSnapshots => {
                                    const productsFound = productSnapshots.map(productSnapshot => productSnapshot.data())
                                    setPurchaseProducts(productsFound)
                                })
                            }
                        } else {
                            console.log('No purchases found for username ' + currentUser.username)
                        }
                        setRefresh(false)
                    })
                    .finally(() => setLoading(false))
            }
        }
        getPurchasedProducts()
    }, [route, refresh])

    if (loading) {
        return <Loading />
    }

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products purchased. Buy one now!</Text>
        </View>
    )

    const productsView = (
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
            {ProductHelper.getProductCardsLong(purchasedProducts)}
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
        backgroundColor: 'white',
    }
});