import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Home from './components/Home';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, Layout, Text } from '@ui-kitten/components';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Profile from './components/Profile';
import Header from './components/Header';
import About from './components/Profile/About';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Login from './components/Login';
import storage from './storage/storage';
import SellDashboard from './components/Profile/Sell/SellDashboard';
import HeaderSell from './components/Profile/Sell/HeaderSell';

const Tab = createBottomTabNavigator();

function Main({ route }) {
  const { currentUser } = route.params

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused
            ? 'home'
            : 'home-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        } else if (route.name === 'Profile') {
          iconName = focused ? 'user-alt' : 'user';
          return <FontAwesome5 name={iconName} size={size} color={color} />;
        }

          return null;
      },
    })}>

      <Tab.Screen name="Home" options={{ header: props => null }}>
        {props => <Home {...props} currentUser={currentUser} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={Profile} options={{ header: props => null }} />
   </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    function checkStorageForUser() {
      if (!currentUser) {
        storage.getCurrentUser()
          .then(user => {
            setCurrentUser(user)
            console.log(user)
          })
          .catch(err => console.error(err))
      }
    }
    checkStorageForUser()
  })

  console.log(currentUser)

  return (
    <ApplicationProvider {...eva} theme={eva.light}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" options={{ header: props => null }} >
            {props => <Login {...props} currentUser={currentUser} />}
          </Stack.Screen>
          <Stack.Screen name="Back" options={{ headerTitle: props => <Header {...props} />, headerBackVisible: false }}>
            {props => <Main {...props} currentUser={currentUser} />}
          </Stack.Screen>
          <Stack.Screen name="SellDashboard" options={{ headerTitle: props => <HeaderSell {...props} />}} >
            {props => <SellDashboard {...props} currentUser={currentUser} />}
          </Stack.Screen>
          <Stack.Screen name="About" component={About} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApplicationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
