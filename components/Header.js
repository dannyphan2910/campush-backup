import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Button } from '@ui-kitten/components';
import { Dimensions, StyleSheet, View } from 'react-native';

const windowWidth = Dimensions.get('window').width;

export default function Header() {

    return (
        <View style={styles.header}>
            <View>
                <Button appearance='ghost' size='giant'>
                    <Feather name="refresh-ccw" size={24} color="black" />
                </Button>
            </View>
            <View>
                <Button appearance='ghost' size='giant'>
                    <Feather name="refresh-ccw" size={24} color="black" />
                </Button>
            </View>
            <View style={{ flex: 1 }}>
                <Button appearance='ghost' size='giant'>
                    <Feather name="shopping-bag" size={24} color="black" />
                </Button>
            </View>
        </View>
    );
  }

const styles = StyleSheet.create({
    header: {
        width: windowWidth - 25,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
});