import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Button, ScrollView} from 'react-native';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  TripDetail: {tripId: string};
};

interface TripDetailScreenProps {
  route: {params: {tripId: string}};
}

const TripDetailScreen: React.FC<TripDetailScreenProps> = ({route}) => {
  const {tripId} = route.params;
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [checkedDestinations, setCheckedDestinations] = useState<string[]>([]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const response = await axios.post(
          'http://192.168.100.38:4000/api/v1/getTrips',
          {
            user_id: 'your_user_id', // Replace with actual user ID
          },
        );
        const trip = response.data.trips.find((t: any) => t._id === tripId);
        setTripDetails(trip);
        const storedChecks = await AsyncStorage.getItem('checkedDestinations');
        if (storedChecks) {
          setCheckedDestinations(JSON.parse(storedChecks));
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const handleCheck = async (destination: string) => {
    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;

        // Here you would normally match the destination with the current location
        // For simplicity, just log the location and destination
        console.log(
          `Current location: ${latitude}, ${longitude} - Destination: ${destination}`,
        );

        // Update checked destinations
        setCheckedDestinations(prev => {
          const newChecked = [...prev, destination];
          AsyncStorage.setItem(
            'checkedDestinations',
            JSON.stringify(newChecked),
          ); // Store the checked destinations
          return newChecked;
        });
      },
      error => {
        console.error('Error getting location:', error);
      },
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  const handleFinish = async () => {
    await AsyncStorage.removeItem('checkedDestinations'); // Clear the checked destinations from storage
    setCheckedDestinations([]); // Reset local state
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Details</Text>
      {tripDetails && (
        <ScrollView>
          {tripDetails.destinations.map((destination: string) => (
            <View
              key={destination}
              style={[
                styles.card,
                checkedDestinations.includes(destination) && styles.checkedCard,
              ]}>
              <Text style={styles.destination}>{destination}</Text>
              {!checkedDestinations.includes(destination) && (
                <Button
                  title="Check"
                  onPress={() => handleCheck(destination)}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}
      <Button title="Finish" onPress={handleFinish} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  checkedCard: {
    backgroundColor: '#d4edda', // Greenish background for checked cards
  },
  destination: {
    fontSize: 18,
  },
});

export default TripDetailScreen;
