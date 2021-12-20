import { Avatar, Divider, Input, Modal } from '@ui-kitten/components'
import React, { useContext, useState } from 'react'
import { Alert, Keyboard, KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { UserContext } from '../../context/user_context'
import { ImageHelper } from '../../helper/helper'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, firebaseStorage } from '../../firebase'
import CameraView from '../CameraView'
import storage from '../../storage/storage';


export default function Account() {
    const { currentUser, setCurrentUser } = useContext(UserContext)
    const [firstName, setFirstName] = useState(currentUser.first_name)
    const [lastName, setLastName] = useState(currentUser.last_name)

    const [avatarURL, setAvatarURL] = useState(currentUser.avatar_url)
    const [cameraOpen, setCameraOpen] = useState(false)

    const [editMode, setEditMode] = useState(false)

    const handleEdit = async () => {
        let url = currentUser.avatar_url
        let uploadedImage = false
        if (avatarURL !== url) {
            try {
                firebaseStorage.refFromURL(url).delete()
                await ImageHelper.deleteImageFromCache(url, currentUser.username)
            } catch (err) {
                console.warn('No exisiting avatar found in Firebase Storage ' + url)
            } finally {
                console.log('Uploading new avatar')
                url = await ImageHelper.uploadImageAsync(avatarURL)
                uploadedImage = true
            }
        }
        const updates = {
            first_name: firstName,
            last_name: lastName,
            avatar_url: url
        }
        db.collection('users').doc(currentUser.username).update(updates)
            .then(() => {
                if (uploadedImage) {
                    setAvatarURL(url)
                }
                setEditMode(false)
                let curr = Object.assign({}, currentUser)
                const newUserInfo = {
                    ...curr,
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: avatarURL
                }
                storage.setCurrentUser(newUserInfo)
                    .then((success) => {
                        if (success) {
                            setCurrentUser(newUserInfo)
                            Alert.alert('Edit successfully')
                        }
                    })
            })
            .catch(err => Alert.alert('Edit unsuccessfully ' + err))
    }

    const handleEditAvatar = () => {
        if (editMode) {
            setCameraOpen(true)
        }
    }

    const handleCancel = () => {
        setAvatarURL(currentUser.avatar_url)
        setFirstName(currentUser.first_name)
        setLastName(currentUser.last_name)
        setEditMode(false)
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={styles.containerRow}>
                        <View style={{flex: 1}}/>
                        <View style={styles.container}>
                            <View style={styles.inputBlock}>
                                <Text style={[styles.text, {color: 'grey'}]}>Your Photo</Text>
                                <TouchableOpacity onPress={handleEditAvatar}>
                                    <Avatar source={{ uri: avatarURL }} size='large' /> 
                                </TouchableOpacity>
                                <Modal visible={cameraOpen} backdropStyle={{ backgroundColor: 'transparent'}}>
                                    <CameraView closeCamera={() => setCameraOpen(false)} setImageURI={setAvatarURL} />
                                </Modal> 
                            </View>
                            <Divider/>
                            <View style={styles.inputBlock}>
                                <Text style={[styles.text, {color: 'grey'}]}>Username</Text>
                                {
                                    editMode ? 
                                    <Text style={[styles.text, {color: 'grey'}]}>{currentUser.username}</Text> :
                                    <Text style={styles.text}>{currentUser.username}</Text>
                                }
                                
                            </View>
                            <Divider/>
                            <View style={styles.inputBlock}>
                                <Text style={[styles.text, {color: 'grey'}]}>First Name</Text>
                                {
                                    editMode ? 
                                    <Input value={firstName} onChangeText={setFirstName} /> :
                                    <Text style={styles.text}>{firstName}</Text>
                                }
                            </View>
                            <Divider/>
                            <View style={styles.inputBlock}>
                                <Text style={[styles.text, {color: 'grey'}]}>Last Name</Text>
                                {
                                    editMode ? 
                                    <Input value={lastName} onChangeText={setLastName} /> :
                                    <Text style={styles.text}>{lastName}</Text>
                                }
                            </View>
                            <Divider/>
                            <View style={styles.inputBlock}>
                                <Text style={[styles.text, {color: 'grey'}]}>Email</Text>
                                {
                                    editMode ?
                                    <Text style={[styles.text], {color: 'grey', fontSize: 16}}>{currentUser.email}</Text> :
                                    <Text style={styles.text}>{currentUser.email}</Text>
                                }
                                
                            </View>
                            <Divider/>
                        </View>
                        <View style={[styles.container, {flex: 1,}]}>
                            <View style={styles.inputBlock}>
                                {
                                    editMode ? 
                                    <Feather name="edit-2" size={15} color="black"/> :
                                    <View/>
                                }
                            </View>

                            <View style={styles.inputBlock}>
                                {
                                    editMode ? 
                                    <Feather name="lock" size={15} color="black" /> :
                                    <View/>
                                }
                                
                            </View>

                            <View style={styles.inputBlock}>
                                {
                                    editMode ? 
                                    <Feather name="edit-2" size={15} color="black"/> :
                                    <View/>
                                }
                                
                            </View>

                            <View style={styles.inputBlock}>
                                {
                                    editMode ? 
                                    <Feather name="edit-2" size={15} color="black"/> :
                                    <View/>
                                }
                                
                            </View>

                            <View style={styles.inputBlock}>
                                {
                                    editMode ? 
                                    <Feather name="lock" size={15} color="black" /> :
                                    <View/>
                                }
                                
                            </View>
                        </View>
                    </View>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        {
                            editMode ? 
                            <View style={{ flexDirection: 'row' }}>
                                <Feather name="check" size={30} color="black" style={[styles.buttonStyle, { marginRight: 15, backgroundColor: '#C6D57E' }]} onPress={handleEdit} />
                                <MaterialCommunityIcons name="cancel" size={30} color="black" style={[styles.buttonStyle, { marginLeft: 15, backgroundColor: '#D57E7E' }]} onPress={handleCancel} />
                            </View> :
                            <Feather name="edit-2" size={30} color="black" style={[styles.buttonStyle, { backgroundColor: '#FFE1AF' }]} onPress={() => setEditMode(true)} />
                        }
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    containerRow: {
        flex: 1,
        flexDirection: 'row',
        
    },
    container: {
        flex: 8,
        paddingVertical: 20,
    },
    text: {
        fontSize: 16,

    },
    inputBlock: {
        flex: 1, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 10,
        paddingHorizontal: 8,
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
    }
})