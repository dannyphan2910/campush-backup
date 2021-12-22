import { Button, Input, Modal, Select, SelectItem, Text } from '@ui-kitten/components';
import React, { useContext, useState } from 'react';
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, StyleSheet, TouchableWithoutFeedback, View, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { db, firebaseStorage } from '../../../firebase';
import { ImageHelper, ProductHelper } from '../../../helper/helper';
import { UserContext } from '../../../context/user_context';
import CameraView from '../../CameraView'
import firebase from "firebase";
import { AntDesign } from '@expo/vector-icons'; 

const windowWidth = Dimensions.get('window').width;

export default function SellProduct({ route }) {
    let isEditMode = false
    let product = undefined
    if (route && route.params) {
        isEditMode = route.params.isEditMode
        product = route.params.product
    }

    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [name, setName] = useState(isEditMode && product ? product.name : "")
    const [condition, setCondition] = useState(isEditMode && product ? product.condition : "")
    const [brand, setBrand] = useState(isEditMode && product ? product.brand : "")
    const [description, setDescription] = useState(isEditMode && product ? product.description : "")
    const [price, setPrice] = useState(isEditMode && product ? product.price : 0)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [imageURIs, setImageURIs] = useState(isEditMode && product ? product.thumbnail_urls : [])

    const handleSubmit = () => {
        Keyboard.dismiss()

        db.runTransaction(async (transaction) => {
            // upload photo to Firebase Storage
            const urls = await Promise.all(imageURIs.map(imageURI => ImageHelper.uploadImageAsync(imageURI)))
            
            // upload the new product to Firebase Realtime Database
            const productsRef = db.collection('products').doc()
            const id = productsRef.id
            const product = {
                id: id,
                name: name,
                description: description,
                price: parseFloat(price),
                condition: condition,
                brand: brand,
                favorited_by: [],
                thumbnail_urls: urls,
                sold_by: db.collection('users').doc(currentUser.username),
                // purchased_by: null,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            }
            
            const productRef = db.collection('products').doc(id)
            const userProductsRef = db.collection('users_products').doc(currentUser.username)
            return transaction.get(userProductsRef).then(snapshot => {
                transaction.set(productRef, product)

                if (!snapshot.exists) {
                    transaction.set(userProductsRef, {
                        active: []
                    })
                }
                transaction.update(userProductsRef, { active: firebase.firestore.FieldValue.arrayUnion(productRef) })
            })
        })
        .then(() => {
            navigation.navigate('SellDashboard', { refresh: true })
            Alert.alert('Data saved successfully')
        })
        .catch(err => { 
            Alert.alert('Data could not be saved: ' + err)
            console.error(err) 
        })
    }

    const handleEditSave = async () => {
        if (isEditMode && product) {
            // delete all removed images from the storage
            await Promise.all(product.thumbnail_urls.map(async (productURI) => {
                if (!imageURIs.includes(productURI)) {
                    firebaseStorage.refFromURL(productURI).delete()
                }
            }))
            // upload new images to the storage (while keeping the uploaded ones)
            const urls = await Promise.all(imageURIs.map(async (imageURI) => {
                let url = imageURI
                // not available in storage = new image
                try {
                    firebaseStorage.refFromURL(url)
                } catch(err) {
                    url = await ImageHelper.uploadImageAsync(url)
                }
                return url
            }))

            const updates = {
                name: name,
                brand: brand,
                condition: condition,
                description: description,
                price: parseFloat(price),
                thumbnail_urls: urls
            }
            db.collection('products').doc(product.id).update(updates)
                .then(() => { Alert.alert('Edit successfully'); navigation.navigate('Product', { id: product.id, refresh: true }) })
                .catch(err => { Alert.alert('Edit unsuccessfully ' + err); console.error(err) })
        }
    }

    const addImageURI = (uri) => {
        const newURIs = [...imageURIs, uri]
        setImageURIs(newURIs)
    }

    const removeImageURI = (index) => {
        const currURIs = Object.assign([], imageURIs)
        const removedURI = currURIs.splice(index, 1)
        setImageURIs(currURIs)
        return removedURI
    }

    return (
        <KeyboardAvoidingView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.container, { paddingBottom: 30 }]}>
                    <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: 10 }}>
                        <View style={{ flex: 1, marginBottom: 5 }}>
                            <Text style={styles.title}>Product Name</Text>
                            <Input
                                value={name}
                                style={styles.input}
                                onChangeText={setName}
                                placeholder="Name"
                            />
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', width: windowWidth-40, marginBottom: 5 }}>
                            <Text style={styles.title}>Product Condition</Text>
                            <Select 
                                placeholder='Condition'
                                value={condition}
                                onSelect={index => setCondition(ProductHelper.CONDITIONS[index-1]['name'])}>
                                {ProductHelper.CONDITIONS.map(conditionObj => (
                                    <SelectItem 
                                        title={conditionObj['name']} 
                                        key={conditionObj['name']} />
                                ))}
                            </Select>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', marginBottom: 10 }}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={styles.title}>Price (in USD)</Text>
                                <Input
                                    value={price.toString()}
                                    style={styles.input}
                                    onChangeText={setPrice}
                                    placeholder="Price"
                                    keyboardType="numeric"
                                    accessoryLeft={() => <Text>$</Text>}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 5, marginBottom: 10 }}>
                                <Text style={styles.title}>Brand (optional)</Text>
                                <Input
                                    value={brand}
                                    style={styles.input}
                                    onChangeText={setBrand}
                                    placeholder="Brand"
                                />
                            </View>
                        </View>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.title}>Product Description (optional)</Text>
                            <Input
                                value={description}
                                style={styles.input}
                                multiline={true}
                                maxLength={200}
                                textStyle={{ minHeight: 64 }}
                                onChangeText={setDescription}
                                placeholder="Description (max 200 characters)"
                            />
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
                            <Button
                                style={styles.button}
                                onPress={() => { Keyboard.dismiss(); setCameraOpen(true); }}
                                status='success'
                                disabled={imageURIs.length >= 3}
                            >
                                Add Photo ({imageURIs.length}/3)
                            </Button>
                        </View>
                        <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center', }}>
                            {
                                imageURIs.length > 0 && 
                                <FlatList
                                    pagingEnabled
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={false}
                                    data={imageURIs}
                                    getItemLayout={(data, index) => ({ length: windowWidth, offset: windowWidth*index, index })}
                                    keyExtractor={({ item, index }) => index}
                                    renderItem={({ item, index }) => (
                                        <Pressable style={{ alignSelf: 'center', alignItems: 'center', width: windowWidth }} key={index}>
                                            <View>
                                                <Image style={styles.image} source={{ uri: item }} key={index} />
                                                <AntDesign 
                                                    name="minuscircle" 
                                                    size={25} 
                                                    color="red" 
                                                    style={{ position: 'absolute', top: -10, right: -10 }} 
                                                    onPress={() => removeImageURI(index)} />
                                            </View>
                                        </Pressable>
                                    )}
                                />
                            }
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
                            {
                                (isEditMode && product) ?
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                    <View style={{ flex: 1 }}>
                                        <Button
                                            disabled={!(name && condition && price && imageURIs.length > 0)}
                                            style={[styles.button, { width: '75%'}]}
                                            onPress={handleEditSave}
                                            status='info'
                                        >
                                            Save Changes
                                        </Button>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Button
                                            style={[styles.button, { width: '75%'}]}
                                            onPress={() => navigation.navigate('Product', { id: product.id, refresh: true })}
                                            status='info'
                                        >
                                            Cancel
                                        </Button>
                                    </View>
                                </View>:
                                <Button
                                    disabled={!(name && condition && price && imageURIs.length > 0)}
                                    style={styles.button}
                                    onPress={handleSubmit}
                                    status='info'
                                >
                                    Create Product
                                </Button>
                            }
                        </View>
                        <Modal visible={cameraOpen} backdropStyle={{ backgroundColor: 'transparent'}}>
                            <CameraView closeCamera={() => setCameraOpen(false)} addImageURI={addImageURI} />
                        </Modal>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};


const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        height: 40,
        backgroundColor: 'white',
        alignSelf: 'center'
    },
    button: {
        alignSelf: 'center',
        backgroundColor: 'black',
        borderWidth: 0,
        borderRadius: 5
    },
    image: {
        width: 200,
        height: 200
    },
    title: {
        marginVertical: 5,
        fontSize: 15,
        color: 'grey',
    },
});