import React, { useState, useEffect, useContext } from 'react';
import Home from './components/Home';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
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
import SellProduct from './components/Profile/Sell/SellProduct';
import { UserContext, UserProvider } from './context/user_context';
import PurchasedList from './components/Profile/History/PurchasedList';
import SoldList from './components/Profile/History/SoldList';
import Product from './components/Product';

const Tab = createBottomTabNavigator();

function Main() {
  const { currentUser, setCurrentUser } = useContext(UserContext)

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
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

        <Tab.Screen name="Home" options={{ header: props => null }} component={Home} />
        <Tab.Screen name="Profile" options={{ header: props => null }} component={Profile}   />
    </Tab.Navigator>
   </UserContext.Provider>
  );
}

const HistoryTab = createMaterialTopTabNavigator();

function History() {
  const { currentUser, setCurrentUser } = useContext(UserContext)

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <HistoryTab.Navigator>
        <Tab.Screen name="Purchased" component={PurchasedList} />
        <Tab.Screen name="Sold" component={SoldList}   />
      </HistoryTab.Navigator>
    </UserContext.Provider>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    function checkStorageForUser() {
      storage.getCurrentUser()
        .then(user => { setCurrentUser(user) })
        .catch(err => console.error(err))
    }
    checkStorageForUser()
  }, [])

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <ApplicationProvider {...eva} theme={eva.light}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Login" options={{ header: props => null }} component={Login} />
            <Stack.Screen name="Main" options={{ headerTitle: props => <Header {...props} />, headerBackVisible: false }} component={Main} />
            <Stack.Screen name="SellDashboard" options={{ headerTitle: props => <HeaderSell {...props} />}} component={SellDashboard} />
            <Stack.Screen name="SellProduct" options={{ headerBackTitle: '', headerTitle: '' }} component={SellProduct} />
            <Stack.Screen name="History" options={{ headerBackTitle: '' }} component={History} />
            <Stack.Screen name="About" options={{ headerBackTitle: '' }} component={About} />
            <Stack.Screen name="Product" options={{ headerBackTitle: '', headerTitle: '' }} component={Product} />
          </Stack.Navigator>
        </NavigationContainer>
      </ApplicationProvider>
    </UserContext.Provider>
  );
}