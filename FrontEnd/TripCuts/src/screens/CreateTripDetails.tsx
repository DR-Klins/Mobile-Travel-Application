import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import axios from 'axios';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {RootStackParamList} from '../App';

interface TripDetailScreenProps {
  route: {params: {tripId: string}};
}

const CreateTripDetails: React.FC<TripDetailScreenProps> = ({route}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {tripId} = route.params;
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [checkedDestinations, setCheckedDestinations] = useState<string[]>([]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1Ijoia2xpbnNtYW5uIiwiYSI6ImNtMjN3bGhmejBhanEycXFzY3FmcHoyem4ifQ.wTTs41xza38fGRIEsrdp7g`,
      );
      const place = response.data.features[0].place_name;
      console.log('Place Name from Mapbox:', place);
      return place;
    } catch (error) {
      console.error('Error with reverse geocoding:', error);
      return null;
    }
  };

  // Request location permission function
  const requestLocationPermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );

      if (result === RESULTS.GRANTED) {
        console.log('Location permission granted.');
        return true;
      } else {
        console.log('Location permission denied.');
        Alert.alert(
          'Permission Denied',
          'Location permission is required to access your location.',
        );
        return false;
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
      Alert.alert(
        'Error',
        'Failed to request location permission. Please try again later.',
      );
      return false;
    }
  };

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
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      console.log('Fetching current position...'); // Log added
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;

          console.log(
            `Current location: ${latitude}, ${longitude} - Destination: ${destination}`,
          );

          const currentPlaceName = await reverseGeocode(latitude, longitude);

          // Update checked destinations
          if (currentPlaceName.includes(destination)) {
            setCheckedDestinations(prev => {
              const newChecked = [...prev, destination];
              AsyncStorage.setItem(
                'checkedDestinations',
                JSON.stringify(newChecked),
              );
              Alert.alert(
                'Success',
                `You checked ${destination} successfully!`,
              );
              return newChecked;
            });
          } else {
            console.log('You are not at the destination yet.');
            Alert.alert('Failed', `You are not at the destination yet.`);
          }
        },
        error => {
          console.error('Error getting location:', error);
          let errorMessage =
            'Unable to retrieve location. Please check your device settings.';

          // Customize error messages based on the error code
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage =
                'Location permission denied. Please allow access to your location.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage =
                'Location position unavailable. Please try again later.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred. Please try again.';
              break;
          }

          Alert.alert('Error', errorMessage);
        },
        {enableHighAccuracy: true, timeout: 3000, maximumAge: 1000},
      );
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.removeItem('checkedDestinations'); // Clear the checked destinations from storage
    setCheckedDestinations([]); // Reset local state
    Alert.alert('Finished', 'You have completed your trip checks.');
    navigation.navigate('MediaUpload');
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

export default CreateTripDetails;
