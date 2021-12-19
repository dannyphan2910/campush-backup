import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_USER = 'user' // key for users table

const storage = {
    setCurrentUser: async (userInfo) => {
        try {
            const jsonValue = JSON.stringify(userInfo)
            await AsyncStorage.setItem(KEY_USER, jsonValue)
            return true
        } catch(e) {
            // save error
            console.error(e)
        }
    },
    getCurrentUser: async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEY_USER)
            return jsonValue != null ? JSON.parse(jsonValue) : null
        } catch(e) {
            // read error
            console.error(e)
        }
    },
    removeCurrentUser: async () => {
        try {
            await AsyncStorage.removeItem(KEY_USER)
        } catch(e) {
            // read error
            console.error(e)
        }
    }
}

export default storage;