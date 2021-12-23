import React from 'react';
import { View, ActivityIndicator, Dimensions } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

export default function Loading() {
    const headerHeight = useHeaderHeight();
    
    return (
        <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: Dimensions.get('window').height - headerHeight,
            justifyContent: "center",
            backgroundColor: 'white'
        }}>
            <ActivityIndicator size="large" color="black" />
        </View>
    );
}