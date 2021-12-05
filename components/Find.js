import { Input } from '@ui-kitten/components'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { GeneralHelper } from '../helper/helper';
import { db } from '../firebase';

export default function Find() {
    const [searchText, setSearchText] = useState('')
    const [results, setResults] = useState([])

    useEffect(() => {
        const getProducts = () => {
            if (searchText && searchText.length >= 3) {
                db.ref('products').on('value',
                    (querySnapshot) => {
                        if (querySnapshot.exists()) {
                            let products = []
                            querySnapshot.forEach((productSnapshot) => {
                                if (!productSnapshot.hasChild('purchased_by')) {
                                    const product = productSnapshot.val();
                                    if (product.name.toLowerCase().includes(searchText.toLowerCase())) {
                                        products.push(product)
                                    }
                                }
                            });
                            setResults(products)
                        } else {
                            console.log('No products found')
                        }
                    }
                )
            } else {
                if (results.length > 0) {
                    setResults([])
                }
            }
        }
        getProducts()
    }, [searchText])

    const noProductsView = (
        <View style={{ flex: 15, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{searchText.length >= 3 && results.length === 0 ? 'No products matched!' : 'Enter more characters'}</Text>
        </View>
    )

    const productsView = (
        <View style={{ flex: 15 }}>
            <ScrollView >
                {GeneralHelper.getProductCardsLong(results)}
            </ScrollView>
        </View>
    )

    const getProductCards = results.length > 0 ?
                            productsView :
                            noProductsView

    return (
        <KeyboardAvoidingView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.container}>
                    <View style={{ flex: 2, justifyContent: 'center' }}>
                        <Input
                            style={{ backgroundColor: 'white' }}
                            placeholder='Enter product name (more than 3 characters)'
                            onChangeText={setSearchText}
                            accessoryRight={() => <Ionicons name='md-search-outline' size={20} />}
                        />
                    </View>
                    {getProductCards}
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    }
})