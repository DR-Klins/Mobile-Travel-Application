import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlane, faSuitcase, faMap, faMountain } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const TravelCardScreen = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const { getUserID } = useAuth();

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
          setError('Failed to fetch trips. Please try again.');
        }
      } catch (error) {
        console.error(error); // Log the error to the console
        setError('Error fetching trips. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [getUserID]); // Add getUserID as a dependency

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
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleCardPress(item._id)}
      accessibilityLabel={`Trip: ${item.tripName}`}
      accessibilityRole="button" // Added accessibility role
    >
      <FontAwesomeIcon 
        icon={getRandomIcon()} 
        size={30} 
        style={styles.icon} 
      />
      <Text style={styles.title}>{item.tripName}</Text>
    </TouchableOpacity>
  );

  const handleRetry = () => {
    setError(null); // Clear the error
    setLoading(true); // Set loading state to true
    fetchTrips(); // Re-fetch trips
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FAD8B0" />
        <Text style={styles.loadingText}>Loading trips...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
    backgroundColor: '#1B3232',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B3232',
  },
  loadingText: {
    color: '#FAD8B0',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B3232',
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FAD8B0',
    borderRadius: 5,
  },
  retryText: {
    color: '#1B3232',
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'black',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FAD8B0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    marginRight: 10,
    color: '#3D9676',
  },
  title: {
    color: '#FAD8B0',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TravelCardScreen;
