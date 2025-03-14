import React, {useState, useEffect} from 'react';
import {View, Text, Button, FlatList, Alert, Platform} from 'react-native';
import {BleManager} from 'react-native-ble-plx';
import ThermalPrinterModule from 'react-native-thermal-printer';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const BluetoothPrinter = () => {
  const [devices, setDevices] = useState([]); // List of Bluetooth devices
  const [scanning, setScanning] = useState(false); // Scanning status
  const manager = new BleManager();

  useEffect(() => {
    requestBluetoothPermissions();
    return () => manager.destroy(); // Cleanup BLE manager on unmount
  }, []);

  /** Request Bluetooth Permissions */
  async function requestBluetoothPermissions() {
    console.log('🔵 Checking Bluetooth Permissions...');

    if (Platform.OS === 'android') {
      const permissions = [
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, // Needed for scanning
      ];

      for (const permission of permissions) {
        const result = await check(permission);
        console.log(`✅ Permission Check for ${permission}: ${result}`);

        if (result !== RESULTS.GRANTED) {
          console.log(`⚠️ Requesting permission for ${permission}`);
          const requestResult = await request(permission);

          if (requestResult !== RESULTS.GRANTED) {
            console.log(`⛔ Permission Denied for ${permission}`);
            Alert.alert('Permission Denied', 'Bluetooth access is required.');
            return;
          }
        }
      }
    } else if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
      console.log(`✅ iOS Bluetooth Permission Result: ${result}`);

      if (result !== RESULTS.GRANTED) {
        console.log('⛔ iOS Bluetooth Permission Denied!');
        Alert.alert(
          'Permission Denied',
          'Please enable Bluetooth access in settings.',
        );
      }
    }
  }

  /** Start Scanning for Bluetooth Devices */
  const scanDevices = () => {
    setDevices([]);
    setScanning(true);
    console.log('🚀 Starting Bluetooth Scan...');

    manager.startDeviceScan([], {allowDuplicates: false}, (error, device) => {
      if (error) {
        console.log('⛔ Scan Error:', error);
        setScanning(false);
        return;
      }

      console.log(
        `🔍 Found Device: ${device.name || 'Unknown'} - ${device.id}`,
      );

      // Allow devices even if they don't have a name
      setDevices(prevDevices => {
        if (!prevDevices.some(d => d.id === device.id)) {
          console.log('📌 Device Added to List');
          return [...prevDevices, device];
        }
        console.log('🔄 Device Already in List, Skipping...');
        return prevDevices;
      });
    });

    // Stop scanning after 5 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
      console.log('⏹️ Stopped Scanning.');
    }, 5000);
  };

  /** Connect & Print */
  const printText = async macAddress => {
    try {
      console.log(`🖨️ Connecting to Printer: ${macAddress}`);
      await ThermalPrinterModule.connectBluetooth(macAddress);
      console.log('✅ Connected to Printer');

      console.log('📝 Sending Print Data...');
      await ThermalPrinterModule.printText('Hello, this is a test print!\n', {
        beep: true,
        cut: false,
      });

      console.log('🔌 Disconnecting from Printer...');
      await ThermalPrinterModule.disconnectBluetooth();

      Alert.alert('Success', 'Print sent successfully!');
    } catch (error) {
      console.warn('⛔ Printing Failed:', error);
      Alert.alert('Error', 'Failed to print. Please try again.');
    }
  };

  return (
    <View style={{flex: 1, padding: 20}}>
      <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 10}}>
        Bluetooth Printer
      </Text>

      <Button
        title="Scan for Devices"
        onPress={scanDevices}
        disabled={scanning}
      />
      {scanning && <Text style={{marginTop: 10}}>Scanning...</Text>}

      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={{padding: 10, borderBottomWidth: 1}}>
            <Text>Name: {item.name || 'Unnamed Device'}</Text>
            <Text>ID: {item.id}</Text>
            <Button title="Print Test" onPress={() => printText(item.id)} />
          </View>
        )}
      />
    </View>
  );
};

export default BluetoothPrinter;
