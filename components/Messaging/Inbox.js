import React, { useContext, useEffect, useRef, useState } from 'react'
import { Alert, Animated, I18nManager, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { UserContext } from '../../context/user_context'
import { db, realtimedb } from '../../firebase'
import { MessageHelper } from '../../helper/helper'
import { Feather } from '@expo/vector-icons'; 
import Loading from '../Loading'
import { Divider, Input } from '@ui-kitten/components'


export default function Inbox() {
    const { currentUser } = useContext(UserContext)

    const [conversations, setConversations] = useState([])
    const [searchText, setSearchText] = useState('')

    const [showArchived, setShowArchived] = useState(false)
    const [refresh, setRefresh] = useState(true)
    const [loading, setLoading] = useState(false)

    const swipeRefs = useRef([])

    useEffect(() => {
        const getConversations = () => {
            realtimedb.ref('users_conversations').child(currentUser.username)
                .orderByChild('last_updated')
                .on('value', snapshots => {
                    if (snapshots.exists()) {
                        let convosFound = []
                        snapshots.forEach(snapshot => {
                            const data = snapshot.val()
                            convosFound.push(data)
                        })
                        if (searchText && searchText.length > 0) {
                            convosFound = convosFound.filter(c => c.to_username.toLowerCase().includes(searchText.toLowerCase()))
                        }
                        if (!showArchived) {
                            convosFound = convosFound.filter(c => !c.is_archived)
                        }
                        const userPromises = convosFound.map(async ({ id, to_username, last_message, last_updated, is_archived }, index) => {
                            return {
                                id: id,
                                last_message: last_message,
                                last_updated: last_updated,
                                is_archived: is_archived,
                                index: index,
                                userRef: await db.collection('users').doc(to_username).get()
                            }
                        })
                        Promise.all(userPromises).then(infos => {
                            const convos = infos.map(({ id, index, last_message, last_updated, is_archived, userRef }) => ({
                                id: id,
                                last_message: last_message,
                                last_updated: last_updated,
                                is_archived: is_archived,
                                index: index,
                                sendee: userRef.data()
                            }))
                            setConversations(convos)
                        })
                    } else {
                        console.log('No conversations found for username ' + currentUser.username)
                    }
                    setRefresh(false)
                })
        }

        setLoading(true)
        getConversations()
        setLoading(false)

    }, [refresh, showArchived, searchText])

    if (loading) {
        return <Loading />
    }

    const noConvosView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No conversations found</Text>
        </View>
    )

    const renderRightActions = (progress, dragX) => {
        const scale = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        })

        return (
          <TouchableOpacity style={styles.rightAction}>
                <Animated.Text
                    style={{
                        color: 'white',
                        paddingHorizontal: 20,
                        fontWeight: '600',
                        transform: [{ scale }]
                    }}>
                    <Feather name="archive" size={30} color="white" />
                </Animated.Text>
          </TouchableOpacity>
        );
    };

    const handleArchive = (index) => {
        setLoading(true)

        const conversation = conversations[index]

        let updates = {}
        updates[`/conversations/${conversation.id}/is_archived`] = true
        updates[`/users_conversations/${currentUser.username}/${conversation.id}/is_archived`] = true
        updates[`/users_conversations/${conversation.sendee.username}/${conversation.id}/is_archived`] = true

        realtimedb.ref().update(updates)
            .then(() => { Alert.alert('Archive conversation successfully') })
            .catch(err => { Alert.alert('Conversation could not be archived: ' + err); console.error(err) })
            .finally(() => setLoading(false))
    }

    const handleSwipeArchive = (index) => {
        const conversation = conversations[index]

        Alert.alert(
            'Are you sure?', 
            `Archiving this conversation with ${conversation.sendee.username} stops both parties from messaging each other.\nThis conversation will then be deleted in 30 days.`,     
            [
                {
                    text: "Cancel",
                    onPress: () => swipeRefs.current[index].close(),
                    style: "cancel",
                },
                {
                    text: "Archive",
                    onPress: () => handleArchive(index),
                    style: "destructive",
                },
            ],
            {
                cancelable: true,
            }
        )
    }

    const convoCards = MessageHelper.getConvoCards(conversations)
    const convoCardsWithArchive = convoCards.map((card, index) => {
        const convo = conversations[index]
        if (convo.is_archived) {
            return card
        } else {
            return (
                <Swipeable 
                    ref={ref => swipeRefs.current[index] = ref}
                    renderRightActions={renderRightActions}
                    onSwipeableRightOpen={() => handleSwipeArchive(index)}
                    key={convo.id}
                >
                    {card}
                </Swipeable>
            )
        }
    })

    const convoView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ScrollView style={{ width: '100%' }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                {convoCardsWithArchive}
            </ScrollView>
        </View>
    )

    const getProductCards = conversations.length > 0 ?
                            convoView :
                            noConvosView


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', margin: 10 }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Pressable 
                        style={{ backgroundColor: showArchived ? 'black' : 'lightgray', justifyContent: 'center', alignItems: 'center', borderWidth: 0, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, padding: 10, width: '100%', height: 55 }} 
                        onPress={() => setShowArchived(!showArchived)}>
                        <Feather name="archive" size={20} color="white" />
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
            <Divider />
            {getProductCards}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white'
    },
    rightAction: {
        alignItems: 'center',
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        backgroundColor: '#dd2c00',
        flex: 1,
        justifyContent: 'flex-end'
    }
});