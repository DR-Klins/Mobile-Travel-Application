import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../App';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleCreateTripPress = () => {
    console.log('Profile button pressed!');
    navigation.navigate('CreateTrip');
  };

  const handleBagPress = () => {
    console.log('Bag button pressed!');
    navigation.navigate('Bag');
  };

  return (
    <View style={styles.container}>
      {/* Bag button with an icon */}
      <View style={styles.bagButton}>
        <TouchableOpacity onPress={handleBagPress}>
          <Icon name="backpack" size={54} color="black" />
        </TouchableOpacity>
      </View>
      <Text style={styles.header}>Profile</Text>
      <Text style={styles.content}>This is your profile page.</Text>
      <TouchableOpacity style={styles.button} onPress={handleCreateTripPress}>
        <Text style={[styles.buttonText, styles.textBorder]}>
          Create A Trip
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAD8B0',
    position: 'relative',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    marginBottom: 60,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1B3232',
    backgroundColor: '#3D9676',
    shadowColor: '#000', // Shadow color
    shadowOffset: {width: 0, height: 2}, // Shadow offset
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 3, // Shadow radius
    elevation: 5, // Android shadow
  },
  buttonText: {
    color: '#E7B171',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textBorder: {
    fontSize: 19,
    textShadowColor: '#1B3232', // Border color
    textShadowOffset: {width: 1, height: 1}, // Shadow offset for border effect
    textShadowRadius: 1, // Shadow radius
  },
  bagButton: {
    position: 'absolute',
    top: 10, // Adjust this based on search bar position
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Transparent background
    padding: 10,
    borderRadius: 25, // Rounded button
  },
});

export default ProfileScreen;
