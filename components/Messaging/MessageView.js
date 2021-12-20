import { useNavigation } from '@react-navigation/native';
import React, { useState, useCallback, useEffect, useContext } from 'react'
import { Image, KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import { GiftedChat, Send } from 'react-native-gifted-chat'
import { UserContext } from '../../context/user_context';
import { db } from '../../firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Divider, Text } from '@ui-kitten/components';
import { FontAwesome } from '@expo/vector-icons';


export default function MessageView({ route }) {
    const { productId, sellerUsername } = route.params;
    const { currentUser } = useContext(UserContext)

    const insets = useSafeAreaInsets()
    const navigation = useNavigation()

    const [product, setProduct] = useState()
    const [seller, setSeller] = useState() 
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const getProduct = () => {
            if (productId && !product) {
                db.collection('products').doc(productId).get()
                    .then((snapshot) => {
                        if (snapshot.exists) {
                            const product = snapshot.data()
                            setProduct(product)
                        } else {
                            console.log('No product found for id ' + productId)
                        }
                    })
            }
        }

        const getSellerProfile = () => {
            if (sellerUsername && !seller) {
                db.collection('users').doc(sellerUsername).get()
                    .then((snapshot) => {
                        if (snapshot.exists) {
                            const user = snapshot.data()
                            setSeller(user)
                        } else {
                            console.log('No user found for username ' + sellerUsername)
                        }
                    })
            }
        }

        getProduct()
        getSellerProfile()

        // setMessages([
        //     {
        //         _id: 1,
        //         text: 'Hello developer',
        //         createdAt: new Date(),
        //         user: {
        //             _id: 2,
        //             name: 'React Native',
        //             avatar: 'https://placeimg.com/140/140/any',
        //         },
        //     },
        // ])
    }, [])

  
    const onSend = useCallback((messages = []) => {
      setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
    }, [])

    if (!product || !currentUser || !seller) {
        return null
    }

    const productCard = (() => {
        console.log(product)
        return (
            <TouchableOpacity style={{ height: '100%', backgroundColor: 'white', padding: 15 }} key={product.id} onPress={() => navigation.navigate('Product', { id: product.id })}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    <View style={{ flex: 2, justifyContent: 'center' }}>
                        <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_url }} />
                    </View>
                    <View style={{ flex: 3, justifyContent: 'space-between' }}>
                        <Text><Text category='s1'>Name: </Text>{product.name}</Text>
                        <Text><Text category='s1'>Price: </Text>${product.price}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    })()
  
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={{ flex: 1 }}>
                {productCard}
            </View>
            <Divider />
            <View style={{ flex: 5 }}>
                <GiftedChat
                    messages={messages}
                    style={{ backgroundColor: 'white' }}
                    onSend={messages => onSend(messages)}
                    user={{
                        _id: 1,
                    }}
                    bottomOffset={insets.bottom}
                    renderSend={props => (
                        <Send {...props}>
                            <View style={{ marginRight: 15, marginBottom: 10 }}>
                                <FontAwesome name="send" size={24} color="black" />
                            </View>
                        </Send>
                    )}
                />
            </View>
            {
                Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />
            }
        </View>
    )
}