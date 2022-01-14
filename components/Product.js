import { useNavigation } from '@react-navigation/core';
import { Button, Divider, Input, Text } from '@ui-kitten/components';
import React, { useContext, useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Alert, Dimensions, Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, Keyboard } from 'react-native'
import { UserContext } from '../context/user_context';
import { db, realtimedb } from '../firebase';
import { GeneralHelper } from '../helper/helper';
import { FontAwesome, Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import firebase from "firebase";
import CachedImage from './CachedImage';
import { FlatList } from 'react-native-gesture-handler';
import Loading from './Loading';
import BottomSheet from 'reanimated-bottom-sheet';
import { AirbnbRating, Rating } from 'react-native-ratings';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function Product({ route }) {
    const { id } = route.params;
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()
    const sheetRef = useRef();

    const [product, setProduct] = useState()
    const [seller, setSeller] = useState()
    const [feedback, setFeedback] = useState()
    const [isFavorited, setIsFavorited] = useState(false)
    const [numInCart, setNumInCart] = useState(0) 
    const [isInCart, setIsInCart] = useState(false)

    const [rating, setRating] = useState(3)
    const [details, setDetails] = useState('')
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    const [refresh, setRefresh] = useState(true)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const getProduct = () => {
            if (id && currentUser) {
                setLoading(true)
                const productRef = db.collection('products').doc(id)
                productRef.get().then((snapshot) => {
                        if (snapshot.exists) {
                            const product = snapshot.data()
                            setProduct(product)
                            const favorited = product.favorited_by
                                .map(userRef => userRef.id)
                                .includes(currentUser.username)
                            setIsFavorited(favorited)

                            product.sold_by.get().then(snapshot => setSeller(snapshot.data()))
                            if (product.has_feedback) {
                                product.feedback.get().then(snapshot => setFeedback(snapshot.data()))
                            }
                        } else {
                            console.log('No product found for id ' + id)
                        }
                        setRefresh(false)
                    })

                db.collection('users_carts').where('products', 'array-contains', productRef).get()
                    .then(snapshot => {
                        if (!snapshot.empty) {
                            setNumInCart(snapshot.size)
                        }
                    })

                db.collection('users_carts').doc(currentUser.username).get()
                    .then(snapshot => {
                        if (snapshot.exists) {
                            const productsRef = snapshot.get('products')
                            if (productsRef) {
                                const productIds = productsRef.map(ref => ref.id)
                                if (productIds.includes(id)) {
                                    setIsInCart(true)
                                } 
                            }
                        }
                    })

                setLoading(false)
            }
        }
        getProduct()
    }, [route, refresh])

    if (!product || !currentUser) {
        return null
    }

    if (loading) {
        return <Loading />
    }

    const handleEdit = () => navigation.navigate('SellProduct', { isEditMode: true, product: product })

    const handleAddToCart = () => {
        db.runTransaction((transaction) => {
            const productRef = db.collection('products').doc(id)

            const userCartRef = db.collection('users_carts').doc(currentUser.username)
            return transaction.get(userCartRef).then(snapshot => {
                if (!snapshot.exists) {
                    transaction.set(userCartRef, {
                        products: []
                    })
                }
                transaction.update(userCartRef, { products: firebase.firestore.FieldValue.arrayUnion(productRef) })
            })
        })
        .then(() => {
            Alert.alert('Added to Cart')
            navigation.navigate('Cart', { refresh: true })
        }).catch(err => console.error(err))
    }

    const handleFavorite = async () => {
        db.runTransaction((transaction) => {
            const productRef = db.collection('products').doc(id)
            const userRef = db.collection('users').doc(currentUser.username)

            const userFavoritesRef = db.collection('users_favorites').doc(currentUser.username)

            const addFavorite = () => {
                transaction.update(userFavoritesRef, { products: firebase.firestore.FieldValue.arrayUnion(productRef) })
                    .update(productRef, { 
                        favorited_by: firebase.firestore.FieldValue.arrayUnion(userRef),
                        favorited_count: firebase.firestore.FieldValue.increment(1)
                    })
            }

            const removeFavorite = () => {
                transaction.update(userFavoritesRef, { products: firebase.firestore.FieldValue.arrayRemove(productRef) })
                    .update(productRef, { 
                        favorited_by: firebase.firestore.FieldValue.arrayRemove(userRef),
                        favorited_count: firebase.firestore.FieldValue.increment(-1)
                    })
            }

            return transaction.get(userFavoritesRef).then(snapshot => {
                if (!snapshot.exists || !snapshot.get('products')) {
                    transaction.set(userFavoritesRef, {
                        products: []
                    })
                    addFavorite()
                } else {
                    const productsRef = snapshot.get('products')
                    if (productRef) {
                        const productIds = productsRef.map(ref => ref.id)
                        if (productIds.includes(id)) {
                            removeFavorite()
                        } else {
                            addFavorite()
                        }
                    }
                }
            })
        })
        .then(() => setRefresh(true))
        .catch(err => console.error(err))
    }

    const getButton = () => {
        if (isInCart) {
            return <Button style={styles.actionButtonStyle} onPress={() => navigation.navigate('Cart')}>IN CART</Button>
        } else if (product.purchased_by) {
            if (!product.has_feedback) {
                return <Button style={styles.actionButtonStyle} onPress={handleOpenTab}>RATE</Button>
            } else {
                return <Button style={[styles.actionButtonStyle, { backgroundColor: 'lightgray' }]} disabled>SOLD</Button>
            }
        } else if (product.sold_by.id === currentUser.username) {
            return <Button style={styles.actionButtonStyle} onPress={handleEdit}>EDIT</Button>
        } else {
            return <Button style={styles.actionButtonStyle} onPress={handleAddToCart}>ADD TO CART</Button>
        }
    }

    const goToChat = () => {
        const navigateToConversation = () => {
            setLoading(true)

            const sender = currentUser.username
            const sendee = product.sold_by.id
            
            const createNewConversation = () => {
                let updates = {}

                const newConvoRef = realtimedb.ref('conversations').push()
                const convoId = newConvoRef.key

                const convo = {
                    id: convoId,
                    users: [
                        sender,
                        sendee
                    ],
                    messages: [],
                    is_archived: false,
                    created_at: firebase.database.ServerValue.TIMESTAMP,
                    last_updated: firebase.database.ServerValue.TIMESTAMP,
                }
                updates[`/conversations/${convoId}`] = convo

                updates[`/users_conversations/${sender}/${convoId}`] = {
                    id: convoId,
                    to_username: sendee,
                    is_archived: false,
                    last_updated: firebase.database.ServerValue.TIMESTAMP,
                }

                updates[`/users_conversations/${sendee}/${convoId}`] = {
                    id: convoId,
                    to_username: sender,
                    is_archived: false,
                    last_updated: firebase.database.ServerValue.TIMESTAMP,
                }

                realtimedb.ref().update(updates)
                
                return convo
            }

            realtimedb.ref('users_conversations').child(sender)
                .orderByChild('to_username').equalTo(sendee)
                .once('value')
                .then(snapshot => {
                    let convo = null
                    if (!snapshot.exists()) {
                        convo = createNewConversation()
                    } else if (snapshot.numChildren() > 1) {
                        throw Error('multiple conversations found: ' + snapshot.numChildren())
                    } else {
                        convo = Object.values(snapshot.val())[0]
                    }

                    navigation.navigate('Chat', { 
                        productId: id, 
                        sendee: seller,
                        conversation: convo
                    })
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false))
        }

        if (product) {
            navigateToConversation()
        }
    }

    const goToInboxFiltered = () => {
        if (product) {
            const params = {
                productId: product.id,
            }
            navigation.navigate('Inbox', params)
        }
    }

    const getView = () => {
        return (
            <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                <View onStartShouldSetResponder={() => true}>
                    <TouchableOpacity style={styles.floatingBtn}> 
                        {
                            !product.is_purchased ?
                            <>
                                <Text style={{ marginRight: 8 }}>{numInCart}</Text>
                                <Ionicons name="eye-outline" size={24} color="black" />
                            </> :
                            <Text style={{ fontWeight: '600' }}>SOLD</Text>
                        }
                    </TouchableOpacity>
                    <FlatList
                        pagingEnabled
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        data={product.thumbnail_urls}
                        getItemLayout={(data, index) => ({ length: windowWidth, offset: windowWidth*index, index })}
                        keyExtractor={({ item, index }) => index}
                        renderItem={({ item, index }) => (
                            <Pressable key={index}>
                                <CachedImage style={{ width: windowWidth, height: windowWidth, alignSelf: 'center' }} source={{ uri: item }} />
                            </Pressable>
                        )}
                    />
                    <View style={{ paddingTop: 10, paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                            <View style={{ flex: 5 }}>
                                <View style={{ flex: 1 }}><Text style={styles.productInfoTitle}>{product.name}</Text></View>
                            </View>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <Text>{product.favorited_by.length}</Text>
                                {
                                    isFavorited ? 
                                    <FontAwesome name="heart" size={24} color="black" style={{marginLeft: 10}} onPress={handleFavorite} /> :
                                    <FontAwesome name="heart-o" size={24} color="black" style={{marginLeft: 10}} onPress={handleFavorite} />
                                }
                            </View>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}><Text style={styles.title}>Condition: </Text><Text>{product.condition}</Text></View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}><Text style={styles.title}>Brand: </Text><Text>{product.brand}</Text></View>
                        <Divider style={{ color: 'black', marginVertical: 20 }} />
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 5, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
                                {seller && seller.avatar_url && 
                                    <Pressable onPress={() => navigation.navigate('SellerProfile', { user: seller })}>
                                        <CachedImage style={{ height: 36, width: 36, borderRadius: 18, marginRight: 10 }} source={{ uri: seller.avatar_url }} />
                                    </Pressable>
                                }
                                <Pressable onPress={() => navigation.navigate('SellerProfile', { user: seller })}>
                                    <Text style={styles.productSoldBy}>{product.sold_by.id}</Text>
                                </Pressable>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                {
                                    product.sold_by.id === currentUser.username ? 
                                    <Feather name="inbox" size={24} color="black" onPress={goToInboxFiltered} /> :
                                    <AntDesign name="message1" size={24} color="black" onPress={goToChat} />
                                }
                            </View>
                        </View>
                        <Text style={{ fontSize: 16 }}>{product.description}</Text>
                    
                        {
                            product.is_purchased &&
                            <View style={{ marginVertical: 20 }}>
                                <Divider style={{ marginBottom: 20 }} />
                                {
                                    product.has_feedback && feedback ? 
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ marginBottom: 10, justifyContent: 'center', alignItems: 'center'}}>
                                            <Text style={styles.title}>Rating: {feedback.rating}/5</Text>
                                            <AirbnbRating 
                                                defaultRating={feedback.rating}
                                                isDisabled
                                                count={5}
                                                size={30}
                                                showRating={false}
                                                selectedColor='black'
                                                unSelectedColor='gainsboro'
                                            />
                                        </View>
                                        {
                                            feedback.details && feedback.details.length > 0 &&
                                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                <Text style={styles.title}>Feedback</Text>
                                                <Text style={{ fontSize: 16 }}>{feedback.details}</Text>
                                            </View>
                                        }
                                    </View> :
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <Text>No feedback available.</Text>
                                        {currentUser.username === product.purchased_by.id && <Text>Rate your experience now!</Text>}
                                    </View> 
                                }
                            </View>
                        }
                    </View>
                </View>
            </ScrollView>
        )
    }

    const renderContent = () => {

        const handleConfirm = () => {
            setLoading(true)

            db.runTransaction((transaction) => {
                const productRef = db.collection('products').doc(id)
                const userRef = db.collection('users').doc(currentUser.username)

                const feedbackRef = db.collection('feedbacks').doc()
                const fId = feedbackRef.id

                const feedbackObj = {
                    id: fId,
                    rating: rating,
                    details: details,
                    by: userRef,
                    product: productRef,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                }
                // creates a new feedback object linked to this product and this user
                transaction.set(feedbackRef, feedbackObj)
                // link the product object with this feedback
                transaction.update(productRef, {
                    feedback: feedbackRef,
                    has_feedback: true
                })  

                return Promise.resolve()
            })
            .then(() => setRefresh(true))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
        }

        const handleCancel = () => {
            setRating(3)
            setDetails('')
            setFeedbackOpen(false)
            sheetRef?.current.snapTo(1)
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
                    height: windowHeight*0.5,
                    paddingBottom: 50
                }}
                onPress={Keyboard.dismiss}
            >
                <View style={{ marginBottom: 5 }}>
                    <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '600' }}>RATE YOUR EXPERIENCE</Text>
                </View>
                <Divider />
                <View style={{ marginVertical: 10, flex: 1 }}>
                    <View style={{ flex: 5 }}>
                        <View style={{ flex: 1, marginBottom: 10, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={styles.title}>Rating: {rating}/5 ({['Terrible', 'Bad', 'Okay', 'Good', 'Great'][(rating-1)]})</Text>
                            <AirbnbRating 
                                defaultRating={rating}
                                count={5}
                                size={30}
                                showRating={false}
                                selectedColor='black'
                                unSelectedColor='gainsboro'
                                onFinishRating={rating => setRating(rating)}
                            />
                        </View>
                        <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={styles.title}>Feedback (optional)</Text>
                            <Input
                                value={details}
                                style={{
                                    backgroundColor: 'white'
                                }}
                                multiline={true}
                                maxLength={200}
                                textStyle={{ height: 100 }}
                                onChangeText={setDetails}
                                placeholder="Feedback (max 200 characters)"
                            />  
                        </View>
                    </View>
                    <View style={{ flex: 1, marginVertical: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                            <Button
                                style={[styles.actionButtonStyle, { alignSelf: 'center', width: '75%'}]}
                                onPress={handleConfirm}
                                status='info'
                            >
                                CONFIRM
                            </Button>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Button
                                style={[styles.actionButtonStyle, { alignSelf: 'center', width: '75%'}]}
                                onPress={handleCancel}
                                status='info'
                            >
                                CANCEL
                            </Button>
                        </View>
                    </View>
                </View>
            </Pressable>
        )
    }

    const handleOpenTab = () => {
        if (feedbackOpen) {
            sheetRef?.current.snapTo(0)
        } else {
            sheetRef?.current.snapTo(1)
        }
        setFeedbackOpen(!feedbackOpen)
    }

    return (
        <KeyboardAvoidingView style={styles.container} keyboardVerticalOffset={StatusBar.currentHeight} behavior="padding">
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); sheetRef?.current.snapTo(1) }}>
                <SafeAreaView style={styles.container}>
                    <View style={{ flex: 10 }}>
                        {getView()}
                    </View>
                    <View style={{ flex: 1}}>
                        <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, borderTopColor: 'black', borderTopWidth: 0.4 }}>
                            <View style={{ flex: 1, justifyContent: 'center'}}>
                                <Text style={styles.productInfoPrice}>${GeneralHelper.numberWithCommas(product.price)}</Text>
                            </View>
                            <View style={{ flex: 1, alignSelf: 'center', justifyContent: 'center' }}>
                                {getButton()}
                            </View>
                        </View>
                    </View>
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
    productInfoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    productInfoPrice: {
        fontSize: 20,
    },
    productSoldBy: {
        fontSize: 16,
        fontWeight: '500',
    },
    productInfoDetail: {
        fontSize: 24,
    },
    button: {
        margin: 50,
        width: '50%'
    },
    image: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonStyle: {
        width: 60, 
        height: 60, 
        borderRadius: 30,
        borderColor: 'grey', 
        borderWidth: 0.1, 
        textAlign: 'center', 
        paddingTop: 15, 
        overflow:'hidden'
    },
    floatingBtn: {                      
        position: 'absolute',                                         
        top: 10,                                                    
        right: 10, 
        backgroundColor: 'white',
        borderRadius: 25,
        borderWidth: 0.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignSelf: 'center',
        zIndex: 10
    },
    actionButtonStyle: { 
        alignSelf: 'flex-end',
        backgroundColor: 'black', 
        borderWidth: 0, 
        borderRadius: 5
    },
    title: {
        marginVertical: 5,
        fontSize: 15,
        color: 'grey',
    },
})