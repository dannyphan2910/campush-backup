import { Button, Divider, IndexPath, Input, Select, SelectItem, Toggle } from '@ui-kitten/components'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Pressable, Dimensions, StatusBar } from 'react-native'
import {  ProductHelper } from '../helper/helper';
import { db } from '../firebase';
import { UserContext } from '../context/user_context';
import Slider from '@react-native-community/slider';
import BottomSheet from 'reanimated-bottom-sheet';

const windowHeight = Dimensions.get('window').height;

const INITIAL_FILTER_CONDITIONS = {
    selectedIndex: ProductHelper.CONDITIONS.map((cond, ind) => new IndexPath(ind)),
    conditions: ProductHelper.CONDITIONS.map(cond => cond['name']),
    brand: '',
    priceMax: null,
    hideSellingFilter: true
}

export default function Find() {
    const { currentUser } = useContext(UserContext)

    const sheetRef = useRef();
    const [filterOpened, setFilterOpened] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(INITIAL_FILTER_CONDITIONS.selectedIndex)

    const [conditionsFilter, setConditionsFilter] = useState(INITIAL_FILTER_CONDITIONS.conditions)
    const [brandFilter, setBrandFilter] = useState(INITIAL_FILTER_CONDITIONS.brand)
    const [priceMaxFilter, setPriceMaxFilter] = useState(INITIAL_FILTER_CONDITIONS.priceMax)
    const [hideSellingFilter, setHideSellingFilter] = useState(INITIAL_FILTER_CONDITIONS.hideSellingFilter)

    const [isActiveFilter, setIsActiveFilter] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [results, setResults] = useState([])

    useEffect(() => {
        const getProducts = () => {

            const satisfyFilterConditions = (productSnapshot) => {
                // only show active/available products
                if (productSnapshot.get('purchased_by')) 
                    return false
                // hides products being sold by current user if chosen (default)
                if (hideSellingFilter 
                    && productSnapshot.get('sold_by') === currentUser.username) 
                    return false
                // filter by condition (if chosen)
                if (conditionsFilter && conditionsFilter.length > 0
                    && !conditionsFilter.includes(productSnapshot.get('condition'))) 
                    return false
                // filter by brand (if chosen)
                if (brandFilter && brandFilter.length > 0 
                    && (!productSnapshot.get('brand') || productSnapshot.get('brand').toLowerCase() !== brandFilter.toLowerCase())) 
                    return false
                
                if (priceMaxFilter) {
                    const priceMax = parseFloat(priceMaxFilter)
                    const priceProduct = parseFloat(productSnapshot.get('price'))
                    if (priceProduct > priceMax) return false
                }

                return true
            } 

            if (currentUser && searchText && searchText.length >= 3) {
                db.collection('products').get()
                    .then(querySnapshot => {
                            if (!querySnapshot.empty) {
                                let products = []
                                querySnapshot.forEach(productSnapshot => {
                                    if (productSnapshot.get('name').toLowerCase().includes(searchText.toLowerCase()) 
                                        && satisfyFilterConditions(productSnapshot)) {
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
    }, [isActiveFilter, searchText])

    const noProductsView = (
        <View style={{ flex: 15, alignItems: 'center' }}>
            <Text style={{ marginTop: 100 }}>{searchText.length >= 3 && results.length === 0 ? 'No products matched!' : 'Enter more characters'}</Text>
        </View>
    )

    const productsView = (
        <View style={{ flex: 15 }}>
            <ScrollView >
                {ProductHelper.getProductCardsLong(results)}
            </ScrollView>
        </View>
    )

    const getProductCards = results.length > 0 ?
                            productsView :
                            noProductsView


    const renderContent = () => {
        const handleSelect = (inds) => {
            const conditions = inds.map(index => ProductHelper.CONDITIONS[index-1]['name'])
            setConditionsFilter(conditions)
            setSelectedIndex(inds)
        }

        const handleRevertChanges = () => {
            setSelectedIndex(INITIAL_FILTER_CONDITIONS.selectedIndex)
            setConditionsFilter(INITIAL_FILTER_CONDITIONS.conditions)
            setBrandFilter(INITIAL_FILTER_CONDITIONS.brand)
            setPriceMaxFilter(INITIAL_FILTER_CONDITIONS.priceMax)
            setHideSellingFilter(INITIAL_FILTER_CONDITIONS.hideSellingFilter)
            setIsActiveFilter(false)
        }

        return (
            <Pressable
                style={{
                    backgroundColor: 'white',
                    borderColor: 'black',
                    borderWidth: 1,
                    borderBottomWidth: 0,
                    borderRadius: 15,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    padding: 16,
                    height: windowHeight*0.5
                }}
                onPress={Keyboard.dismiss}
            >
                <View style={{ marginBottom: 5 }}>
                    <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '600' }}>FILTERS</Text>
                </View>
                <Divider />
                <View style={{ marginVertical: 10, flex: 1 }}>
                    <View style={{ flex: 10 }}>
                        <View style={{ flex: 1, marginBottom: 5 }}>
                            <Text style={styles.title}>Product Condition</Text>
                            <Select 
                                placeholder='Condition'
                                selectedIndex={selectedIndex}
                                multiSelect={true}
                                value={conditionsFilter.join(', ')}
                                onSelect={handleSelect}>
                                {ProductHelper.CONDITIONS.map(conditionObj => (
                                    <SelectItem 
                                        title={conditionObj['name']} 
                                        key={conditionObj['name']} />
                                ))}
                            </Select>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', marginBottom: 10 }}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={styles.title}>Brand</Text>
                                <Input
                                    value={brandFilter}
                                    style={styles.input}
                                    onChangeText={setBrandFilter}
                                    placeholder="Brand"
                                />                                
                            </View>
                            <View style={{ flex: 1, marginLeft: 5, marginBottom: 10, alignItems: 'center' }}>
                                <Text style={styles.title}>Hide My Products</Text>
                                <Toggle checked={hideSellingFilter} onChange={(isChecked) => setHideSellingFilter(isChecked)} />
                            </View>
                        </View>
                        <View style={{ flex: 1, marginBottom: 5 }}>
                            <Text style={styles.title}>Maximum Price ({ priceMaxFilter ? priceMaxFilter : 'No Limit'})</Text>
                            <Slider
                                minimumValue={50}
                                maximumValue={500}
                                step={50}
                                value={priceMaxFilter ? priceMaxFilter : 500}
                                onValueChange={value => setPriceMaxFilter((value === 500 ? null : value))}
                                />    
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                        <View style={{ flex: 1 }}>
                            <Button
                                style={[styles.button, { width: '75%'}]}
                                onPress={() => setIsActiveFilter(true)}
                                status='info'
                            >
                                APPLY
                            </Button>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Button
                                style={[styles.button, { width: '75%'}]}
                                onPress={handleRevertChanges}
                                status='info'
                            >
                                REVERT
                            </Button>
                        </View>
                    </View>
                </View>
            </Pressable>
        )
    };

    const handleOpenTab = () => {
        if (filterOpened) {
            sheetRef?.current.snapTo(0)
        } else {
            sheetRef?.current.snapTo(1)
        }
        setFilterOpened(!filterOpened)
    }

    return (
        <KeyboardAvoidingView style={styles.container} keyboardVerticalOffset={StatusBar.currentHeight} behavior="padding">
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); sheetRef?.current.snapTo(1) }}>
                <SafeAreaView style={[styles.container, { paddingTop: 50, marginHorizontal: 10 }]}>
                    <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Pressable style={{ backgroundColor: isActiveFilter ? 'black' : 'lightgray', justifyContent: 'center', alignItems: 'center', borderWidth: 0, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, padding: 10, width: '100%', height: 55 }} onPress={handleOpenTab}>
                                <Feather name="filter" size={20} color="white" />
                            </Pressable>
                        </View>
                        <View style={{ flex: 5, justifyContent: 'center', alignItems: 'center' }}>
                            <Input
                                textStyle={{ height: 40 }}
                                style={{ backgroundColor: 'white' }}
                                placeholder='Enter product name'
                                onChangeText={setSearchText}
                            />
                        </View>
                    </View>
                    {getProductCards}
                </SafeAreaView>
            </TouchableWithoutFeedback>
            <BottomSheet
                ref={sheetRef}
                snapPoints={['50%', 0]}
                initialSnap={1}
                renderContent={renderContent}
                
            />
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    button: { 
        alignSelf: 'center',
        backgroundColor: 'black', 
        borderWidth: 0, 
        borderRadius: 5
    },
    input: {
        height: 40,
        backgroundColor: 'white',
        alignSelf: 'center'
    },
    title: {
        marginVertical: 5,
        fontSize: 15,
        color: 'grey',
    },
})