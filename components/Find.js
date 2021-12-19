import { Input } from '@ui-kitten/components'
import React, { useContext, useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { GeneralHelper } from '../helper/helper';
import { db } from '../firebase';
import { UserContext } from '../context/user_context';

export default function Find() {
    const { currentUser } = useContext(UserContext)

    const [searchText, setSearchText] = useState('')
    const [results, setResults] = useState([])

    useEffect(() => {
        const getProducts = () => {
            if (currentUser && searchText && searchText.length >= 3) {
                db.collection('products').get()
                    .then(querySnapshot => {
                            if (!querySnapshot.empty) {
                                let products = []
                                querySnapshot.forEach(productSnapshot => {
                                    console.log(productSnapshot.get('name'))
                                    if (!productSnapshot.get('purchased_by')
                                        && productSnapshot.get('sold_by') !== currentUser.username
                                        && productSnapshot.get('name').toLowerCase().includes(searchText.toLowerCase())) {
                                        const product = productSnapshot.data();
                                        products.push(product)
                                    }
                                });
                                setResults(products)
                            } else {
                                console.log('No products found')
                            }
                        })
                    .catch(err => console.error(err))
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