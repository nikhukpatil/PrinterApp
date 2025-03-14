import React from 'react';
import {SafeAreaView} from 'react-native';
import BluetoothPrinter from './component/BluetoothPrinter';

const App = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
      <BluetoothPrinter />
    </SafeAreaView>
  );
};

export default App;
