import { Button } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react'
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { UserContext } from '../context/user_context';
import { db } from '../firebase';
import { UserHelper } from '../helper/helper';

export default function Product({ route }) {
    const { id } = route.params;
    const { currentUser } = useContext(UserContext)
    const username = UserHelper.getUsername(currentUser.email)

    const [product, setProduct] = useState()

    useEffect(() => {
        const getProduct = () => {
            if (id) {
                db.ref('products').child(id).on('value',
                    (snapshot) => {
                        if (snapshot.exists()) {
                            setProduct(snapshot.val())
                        } else {
                            console.log('No product found for id ' + id)
                        }
                    }
                )
            }
        }
        getProduct()
    }, [])

    if (!product) {
        return null
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 10 }}>
                <ScrollView>
                    <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_url }} />
                </ScrollView>
            </View>
            <View style={{ flex: 1 }}>
                <Button style={{ height: '100%' }} disabled={product.purchased_by}>{ product.purchased_by ? 'SOLD' : (product.sold_by === username ? 'EDIT' : 'BUY')   }</Button>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})