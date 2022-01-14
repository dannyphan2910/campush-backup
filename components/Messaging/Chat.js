import { useNavigation } from '@react-navigation/native';
import React, { useState, useCallback, useEffect, useContext } from 'react'
import { Alert, Dimensions, Platform, Pressable, View } from 'react-native';
import { Actions, Bubble, GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat'
import { UserContext } from '../../context/user_context';
import { db, firebaseStorage, realtimedb } from '../../firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@ui-kitten/components';
import { FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';
import CachedImage from '../CachedImage';
import Loading from '../Loading'
import firebase from "firebase";
import { GeneralHelper, ImageHelper, MessageHelper } from '../../helper/helper';
import { getLocationAsync, pickImageAsync, takePictureAsync } from './Actions';
import MapView from 'react-native-maps';
import * as Linking from 'expo-linking';
import SellerProductModal from './Actions'

const windowWidth = Dimensions.get('window').width;

const MSG_LIMIT_INITIAL = 25
const MSG_LIMIT_INCREMENT = 10

export default function Chat({ route }) {
    const { conversation, productId, sendee } = route.params;

    const { currentUser } = useContext(UserContext)

    const insets = useSafeAreaInsets()
    const navigation = useNavigation()

    const [limit, setLimit] = useState(MSG_LIMIT_INITIAL)

    const [messages, setMessages] = useState([])

    const [hasMessagesLeft, setHasMessagesLeft] = useState(true)
    const [visibleProductsCard, setVisibleProductsCard] = useState(false)

    const [loading, setLoading] = useState(false)
    const [loadingAction, setLoadingAction] = useState(false)

    useEffect(() => {
        const getMessages = () => {
            if (conversation && sendee) {
                realtimedb.ref('conversations').child(conversation.id).child('messages')
                    .orderByChild('created_at').limitToLast(limit)
                    .once('value', snapshot => {
                        if (snapshot.exists() && snapshot.numChildren() > 0) {
                            let msgs = []
                            if (snapshot.numChildren() === messages.length) {
                                setHasMessagesLeft(false)
                            } else {
                                snapshot.forEach(msgSnapshot => {
                                    const data = msgSnapshot.val()
                                    msgs.push(data)
                                })
                                msgs = msgs.reverse()
                                MessageHelper.convertMsgFormatDBToUI(msgs, currentUser, sendee)
                                    .then(UIMessages => setMessages(UIMessages))
                            }
                        } else {
                            if (productId) {
                                db.collection('products').doc(productId).get().then(snapshot => {
                                    const product = snapshot.data()
                                    onSend([
                                        { 
                                            _id: GeneralHelper.getRandomID(),
                                            product: product,
                                            createdAt: Date.now(),
                                            user: {
                                                _id: currentUser.username,
                                                name: `${currentUser.first_name} ${currentUser.last_name}`,
                                                avatar: currentUser.avatar_url,
                                            }
                                        }
                                    ])
                                })
                            } else {
                                setMessages([{
                                        _id: GeneralHelper.getRandomID(),
                                        text: `Begin your conversation with ${sendee.username}`,
                                        createdAt: new Date(),
                                        system: true
                                    }])
                            }
                        }
                    })
            }
        }

        setLoading(true)
        navigation.setOptions({ headerTitle: sendee.username })
        getMessages()
        setLoading(false)
    }, [limit])
  
    const onSend = useCallback((messages = []) => {
        const updateDB = async () => {
            let updates = {}

            const msgs = await Promise.all(messages.map(async (msg) => {
                let message = {
                    id: msg._id,
                    by_username: msg.user._id,
                    created_at: firebase.database.ServerValue.TIMESTAMP
                }

                if (msg.image) {
                    const photoURL = await ImageHelper.uploadImageAsync(msg.image)
                    message = {
                        ...message,
                        type: 'image',
                        image: photoURL
                    }
                } else if (msg.location) {
                    message = {
                        ...message,
                        type: 'location',
                        location: msg.location
                    }
                } else if (msg.text) {
                    message = {
                        ...message,
                        type: 'text',
                        text: msg.text
                    }
                } else if (msg.product) {
                    message = {
                        ...message,
                        type: 'product',
                        productId: msg.product.id
                    }
                } else {
                    throw Error('unknown message type')
                }

                updates[`/conversations/${conversation.id}/messages/${msg._id}`] = message
                return message
            }))
            
            realtimedb.ref().update(updates).then(() => {
                let updateTime = {
                    last_updated: firebase.database.ServerValue.TIMESTAMP,
                }
                realtimedb.ref(`conversations/${conversation.id}`).update(updateTime)
    
                if (msgs.length > 0) {
                    updateTime['last_message'] = msgs[msgs.length-1]
                }
                realtimedb.ref(`users_conversations/${currentUser.username}/${conversation.id}`).update(updateTime)
                realtimedb.ref(`users_conversations/${sendee.username}/${conversation.id}`).update(updateTime)
            })
        }

        updateDB()
            .then(() => setMessages(previousMessages => GiftedChat.append(previousMessages, messages)))
            .catch(err => console.error(err))
    }, [])

    if (!currentUser || !sendee || !conversation) {
        return null
    }

    if (loading) {
        return <Loading />
    }

    const renderActions = (props) => {
        const doAction = (func) => {
            console.log('here')
            setLoadingAction(true)
            func(onSend, currentUser)
            .catch(err => console.error(err))
            .finally(() => { setLoadingAction(false); console.log('done') })
        }

        return (
            <>
                <Actions
                    {...props}
                    icon={() => <MaterialIcons name="image" size={24} color={loadingAction ? 'gainsboro' : 'black'} />}
                    onPressActionButton={() => loadingAction ? {} : doAction(pickImageAsync)}
                />
                <Actions
                    {...props}
                    icon={() => <MaterialIcons name="camera-alt" size={24} color={loadingAction ? 'gainsboro' : 'black'} />}
                    onPressActionButton={() => loadingAction ? {} : doAction(takePictureAsync)}
                />
                <Actions
                    {...props}
                    icon={() => <MaterialIcons name="location-pin" size={24} color={loadingAction ? 'gainsboro' : 'black'} />}
                    onPressActionButton={() => loadingAction ? {} : doAction(getLocationAsync)}
                />
                <Actions
                    {...props}
                    icon={() => <Feather name="package" size={24} color={loadingAction ? 'gainsboro' : 'black'} />}
                    onPressActionButton={() => loadingAction ? {} : setVisibleProductsCard(true)}
                />
            </>
        )
    }

    const renderAvatar = (props) => {
        const { user } = props.currentMessage 
        if (user.avatar) {
            return (
                <Pressable 
                    onPress={() => navigation.navigate('SellerProfile', { 
                        user: user._id === sendee.username ? sendee : currentUser 
                    })}>
                    <CachedImage 
                        {...props} 
                        style={{ height: 36, width: 36, borderRadius: 18 }} 
                        source={{ uri: user.avatar }} />   
                </Pressable>
            )
        }
        return null
    }

    const onLoadEarlier = () => {
        if (hasMessagesLeft) setLimit(limit + MSG_LIMIT_INCREMENT)
    }

    const renderBubble = (props) => {
        const openMapAsync = async (location) => {
            if (Platform.OS === 'web') {
                Alert.alert('Opening the map is not supported.')
                return
            }
        
            const url = Platform.select({
                ios: `http://maps.apple.com/?ll=${location.latitude},${location.longitude}`,
                default: `http://maps.google.com/?q=${location.latitude},${location.longitude}`,
            })
        
            try {
                const supported = await Linking.canOpenURL(url)
                if (supported) {
                    return Linking.openURL(url)
                }
                Alert.alert('Opening the map is not supported.')
            } catch ({ message }) {
                console.error(message)
                Alert.alert(message)
            }
        }

        const { currentMessage } = props;
        if (currentMessage.location) {
            return (
                <Bubble 
                    {...props} 
                    renderCustomView={() => (
                        <MapView 
                            onPress={() => openMapAsync(currentMessage.location)}
                            style={{
                                width: 150,
                                height: 100,
                                borderRadius: 13,
                                margin: 3,
                            }} 
                            region={{
                                latitude: currentMessage.location.latitude,
                                longitude: currentMessage.location.longitude,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false} />
                    )}
                /> 
            )
        } else if (currentMessage.product) {
            return (
                <Bubble
                    {...props}
                    renderCustomView={() => MessageHelper.getProductView(navigation, currentMessage.product)}
                />
            )
        } else if (currentMessage.type === 'deleted') {
            return (
                <View style={{ backgroundColor: 'gainsboro', padding: 10, borderRadius: 10, borderColor: 'gray', borderWidth: 1 }}>
                    <Text>Deleted</Text>
                </View>
            )
        }

        return <Bubble {...props} />;
    };

    const handleDeleteMessage = (message) => {

        const updateDBToDelete = (newObj, isLastMessage) => {
            const obj = {
                ...newObj,
                created_at: firebase.database.ServerValue.TIMESTAMP
            }
            realtimedb.ref(`conversations/${conversation.id}/messages/${obj.id}`).set(obj)
                .then(() => {    
                    if (isLastMessage) {
                        let updateTime = {
                            last_updated: firebase.database.ServerValue.TIMESTAMP,
                        }
                        realtimedb.ref(`conversations/${conversation.id}`).update(updateTime)

                        updateTime['last_message'] = obj
                        realtimedb.ref(`users_conversations/${currentUser.username}/${conversation.id}`).update(updateTime)
                        realtimedb.ref(`users_conversations/${sendee.username}/${conversation.id}`).update(updateTime)
                    }
                })
                .catch(err => console.error(err))
        }

        const msgId = message._id

        const newObj = {
            type: 'deleted',
            id: msgId,
            created_at: message.createdAt,
            by_username: message.user._id
        }

        const isLastMessage = msgId === messages[0]._id

        if (message.type === 'image') {
            try {
                firebaseStorage.refFromURL(message.image).delete()
                    .then(() => {
                            updateDBToDelete(newObj, isLastMessage)
                            MessageHelper.convertMsgFormatDBToUI([newObj], currentUser, sendee)
                                .then(objs => {
                                    const newObjForUI = objs[0]
                                    setMessages(previousMessages => previousMessages.map(m => m._id !== msgId ? m : newObjForUI))
                                })
                        })
            } catch(err) {
                Alert.alert('Cannot delete image: ' + err)
                console.error(err)
            }
        } else {
            updateDBToDelete(newObj, isLastMessage)
            MessageHelper.convertMsgFormatDBToUI([newObj], currentUser, sendee)
                .then(objs => {
                    const newObjForUI = objs[0]
                    setMessages(previousMessages => previousMessages.map(m => m._id !== msgId ? m : newObjForUI))
                })
        }
    }

    const onLongPress = (context, currentMessage) => {
        if (currentMessage.user._id === currentUser.username) {
            if (currentMessage.text) {
                const options = [
                    'Copy Text',
                    'Delete',
                    'Cancel',
                ];
                const destructiveButtonIndex = options.length - 2;
                const cancelButtonIndex = options.length - 1;
                context.actionSheet().showActionSheetWithOptions({
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex
                },
                (buttonIndex) => {
                    switch (buttonIndex) {
                        case 0: Clipboard.setString(currentMessage.text); break;
                        case 1: handleDeleteMessage(currentMessage); break;
                    }
                });
            } else if (currentMessage.type !== 'deleted') {
                const options = [
                    'Delete',
                    'Cancel',
                ];
                const destructiveButtonIndex = options.length - 2;
                const cancelButtonIndex = options.length - 1;
                context.actionSheet().showActionSheetWithOptions({
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex
                },
                (buttonIndex) => {
                    switch (buttonIndex) {
                        case 0: handleDeleteMessage(currentMessage); break;
                    }
                });
            }
        } else {
            if (currentMessage.text) {
                const options = [
                  'Copy Text',
                  'Cancel',
                ];
                const cancelButtonIndex = options.length - 1;
                context.actionSheet().showActionSheetWithOptions({
                    options,
                    cancelButtonIndex,
                },
                (buttonIndex) => {
                    switch (buttonIndex) {
                        case 0: Clipboard.setString(currentMessage.text); break;
                    }
                });
            }
        }
    }

    const renderInputToolbar = (props) => {
        if (conversation && conversation.is_archived) {
            return (
                <View style={{ backgroundColor: 'black', height: 44, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white' }}>This conversation is archived</Text>
                </View>
            )
        }
        return <InputToolbar {...props} />
    }
  
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <GiftedChat
                messages={messages}
                scrollToBottom={true}

                renderActions={renderActions}
                renderInputToolbar={renderInputToolbar}

                style={{ backgroundColor: 'white' }}
                bottomOffset={insets.bottom}

                onSend={messages => onSend(messages)}
                user={{
                    _id: currentUser.username,
                    name: `${currentUser.first_name} ${currentUser.last_name}`,
                    avatar: currentUser.avatar_url,
                }}

                renderAvatar={renderAvatar}

                loadEarlier={messages.length >= MSG_LIMIT_INITIAL && hasMessagesLeft}
                infiniteScroll={true}
                onLoadEarlier={onLoadEarlier}

                renderBubble={renderBubble}
                onLongPress={onLongPress}

                renderSend={props => (
                    <Send {...props}>
                        <View style={{ marginRight: 15, marginBottom: 10 }}>
                            <FontAwesome name="send" size={24} color="black" />
                        </View>
                    </Send>
                )}
            />
            <SellerProductModal 
                visible={visibleProductsCard} 
                setVisible={setVisibleProductsCard} 
                sellerUsername={sendee.username} 
                onSend={onSend} />
        </View>
    )
}
