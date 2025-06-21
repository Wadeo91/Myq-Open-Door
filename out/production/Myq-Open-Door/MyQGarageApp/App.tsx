import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://myq-garage-app-tunnel-91dh3nao.devinapps.com';
const PROXY_AUTH = 'Basic ' + btoa('user:34f5149b9a96cf61546bb41a18af35dd');

interface Credentials {
  email: string;
  password: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [garageStatus, setGarageStatus] = useState('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceResult, setVoiceResult] = useState('');

  useEffect(() => {
    checkStoredCredentials();
    initializeVoice();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const checkStoredCredentials = async () => {
    try {
      const storedCredentials = await AsyncStorage.getItem('myq_credentials');
      if (storedCredentials) {
        const creds = JSON.parse(storedCredentials);
        setCredentials(creds);
        setIsLoggedIn(true);
        updateGarageStatus(creds);
      }
    } catch (error) {
      console.error('Error checking stored credentials:', error);
    }
  };

  const initializeVoice = () => {
    Voice.onSpeechStart = () => {
      setIsListening(true);
      setVoiceResult('Listening...');
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        const transcript = event.value[0].toLowerCase();
        setVoiceResult(`You said: "${transcript}"`);
        processVoiceCommand(transcript);
      }
    };

    Voice.onSpeechError = (error) => {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      Alert.alert('Voice Error', 'Speech recognition failed. Please try again.');
    };
  };

  const processVoiceCommand = (transcript: string) => {
    const openCommands = ['open garage door', 'open garage', 'open the garage door', 'open the garage'];
    const closeCommands = ['close garage door', 'close garage', 'close the garage door', 'close the garage'];

    if (openCommands.some(cmd => transcript.includes(cmd))) {
      openGarage();
    } else if (closeCommands.some(cmd => transcript.includes(cmd))) {
      closeGarage();
    } else {
      Alert.alert('Command not recognized', 'Try saying "open garage door" or "close garage door"');
    }
  };

  const startVoiceRecognition = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Voice Error', 'Could not start voice recognition');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': PROXY_AUTH,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const creds = { email, password };
        setCredentials(creds);
        await AsyncStorage.setItem('myq_credentials', JSON.stringify(creds));
        setIsLoggedIn(true);
        updateGarageStatus(creds);
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Login Failed', data.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Network Error', 'Please check your connection');
    } finally {
      setIsLoading(false);
    }
  };

  const openGarage = async () => {
    if (!credentials) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': PROXY_AUTH,
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Garage door opened!');
        updateGarageStatus(credentials);
      } else {
        Alert.alert('Error', data.detail || 'Failed to open garage door');
      }
    } catch (error) {
      console.error('Open garage error:', error);
      Alert.alert('Network Error', 'Please check your connection');
    } finally {
      setIsLoading(false);
    }
  };

  const closeGarage = async () => {
    if (!credentials) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': PROXY_AUTH,
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Garage door closed!');
        updateGarageStatus(credentials);
      } else {
        Alert.alert('Error', data.detail || 'Failed to close garage door');
      }
    } catch (error) {
      console.error('Close garage error:', error);
      Alert.alert('Network Error', 'Please check your connection');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGarageStatus = async (creds: Credentials) => {
    try {
      const params = new URLSearchParams({
        email: creds.email,
        password: creds.password,
      });
      const response = await fetch(`${API_BASE_URL}/status?${params}`, {
        headers: {
          'Authorization': PROXY_AUTH,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setGarageStatus(data.garage_status);
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('myq_credentials');
      setCredentials(null);
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      setGarageStatus('unknown');
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.loginContainer}>
          <Text style={styles.title}>? MyQ Garage Control</Text>
          <Text style={styles.subtitle}>Login to control your garage door</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>? MyQ Garage Control</Text>
          <View style={[styles.statusBadge, garageStatus === 'open' ? styles.openStatus : styles.closedStatus]}>
            <Text style={styles.statusText}>
              {garageStatus.charAt(0).toUpperCase() + garageStatus.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>? Voice Control</Text>
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonListening]}
            onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
            disabled={isLoading}
          >
            <Text style={styles.voiceButtonText}>
              {isListening ? 'Listening...' : 'Tap to Speak'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.voiceInstructions}>
            Say "open garage door" or "close garage door"
          </Text>
          {voiceResult ? (
            <View style={styles.voiceResult}>
              <Text style={styles.voiceResultText}>{voiceResult}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>?? Manual Control</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[styles.button, styles.openButton]}
              onPress={openGarage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>?</Text>
                  <Text style={styles.buttonText}>Open Garage</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={closeGarage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>?</Text>
                  <Text style={styles.buttonText}>Close Garage</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.refreshButton]}
            onPress={() => credentials && updateGarageStatus(credentials)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  openStatus: {
    backgroundColor: '#4CAF50',
  },
  closedStatus: {
    backgroundColor: '#f44336',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginButton: {
    backgroundColor: '#2196F3',
  },
  openButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: '#f44336',
    flex: 1,
    marginLeft: 10,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  controlButtons: {
    flexDirection: 'row',
  },
  voiceButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  voiceButtonListening: {
    backgroundColor: '#00D2FF',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  voiceInstructions: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 15,
  },
  voiceResult: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  voiceResultText: {
    color: '#333',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
  },
  logoutText: {
    color: '#666',
    fontSize: 16,
  },
});
