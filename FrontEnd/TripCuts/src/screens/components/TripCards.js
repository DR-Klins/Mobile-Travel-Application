import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlane, faSuitcase, faMap, faMountain } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';

const TravelCardScreen = () => {
  const [trips, setTrips] = useState([]);

  const navigation = useNavigation();

  const {getUserID} = useAuth();

  useEffect(() => {
    
    const fetchTrips = async () => {
      const userId = await getUserID();
      try {
        const response = await fetch('http://192.168.100.72:4000/api/v1/getTrips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        });

        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips);
        } else {
          console.error('Failed to fetch trips, status code:', response.status);
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchTrips();
  }, []);

  // Function to get random travel-related icons
  const getRandomIcon = () => {
    const icons = [faPlane, faSuitcase, faMap, faMountain];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  // Handle card press event to navigate with tripId
  const handleCardPress = (tripId) => {
    navigation.navigate('CreateTripDetails', { tripId });
  };

  // Render each trip card
  const renderTripCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item._id)}>
      <FontAwesomeIcon icon={getRandomIcon()} size={30} style={styles.icon} />
      <Text style={styles.title}>{item.tripName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        renderItem={renderTripCard}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    marginRight: 10,
    color: '#007BFF', // Icon color
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TravelCardScreen;
