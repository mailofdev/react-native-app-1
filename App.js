import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RadioButton } from 'react-native-elements';

const { width: screenWidth } = Dimensions.get('window');

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <RadioButton 
        title="Test" 
        checked={selectedSource === 'Test'} 
      />
      <RadioButton 
        title="Server" 
        checked={selectedSource === 'Server'} 
      />

      <View>
        <Text>The Country:</Text>
        <TextInput defaultValue="Pakistan" />
        <Text>The Average: 77</Text>
        <View style={{ width: screenWidth * 77/300, height: 10, backgroundColor: 'blue' }}></View>
      </View>

      <View>
        <Text>The Country:</Text>
        <TextInput defaultValue="Australia" />
        <Text>The Average: 31</Text>
        <View style={{ width: screenWidth * 31/300, height: 10, backgroundColor: 'blue' }}></View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
};

export default App;
