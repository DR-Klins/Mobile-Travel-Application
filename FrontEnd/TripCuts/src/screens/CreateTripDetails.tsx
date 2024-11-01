import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import axios from 'axios';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {RootStackParamList} from '../App';
import {useAuth} from './context/AuthContext';

interface Destination {
  destinationName: string;
  visited: boolean;
  time: string | null;
}

interface TripDetails {
  _id: string;
  tripName: string;
  tripType: string;
  budget: string;
  destinations: Destination[];
}

interface TripDetailScreenProps {
  route: {params: {tripId: string}};
}

const CreateTripDetails: React.FC<TripDetailScreenProps> = ({route}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {tripId} = route.params;
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const {getUserID} = useAuth();

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1Ijoia2xpbnNtYW5uIiwiYSI6ImNtMjN3bGhmejBhanEycXFzY3FmcHoyem4ifQ.wTTs41xza38fGRIEsrdp7g`,
      );
      const place = response.data.features[0].place_name;
      return place;
    } catch (error) {
      console.error('Error with reverse geocoding:', error);
      return null;
    }
  };

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
      const user_id = await getUserID();

      try {
        const response = await axios.post(
          'http://192.168.100.72:4000/api/v1/getTrips',
          {user_id},
        );
        const trip = response.data.trips.find((t: any) => t._id === tripId);
        setTripDetails(trip);

        if (trip.destinations.every((dest: Destination) => dest.visited)) {
          navigation.goBack(); // Go back once
          navigation.navigate('MediaUpload', {tripId});
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, navigation]);

  const handleCheck = async (destinationName: string) => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      console.log('Fetching current position...');
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;
          const currentPlaceName = await reverseGeocode(latitude, longitude);

          if (currentPlaceName.includes(destinationName.split(',')[0].trim())) {
            try {
              await axios.post(
                'http://192.168.100.72:4000/api/v1/updateVisited',
                {
                  tripId,
                  destinationName,
                },
              );

              setTripDetails((prevDetails: TripDetails | null) => ({
                ...prevDetails!,
                destinations: prevDetails!.destinations.map(
                  (dest: Destination) =>
                    dest.destinationName === destinationName
                      ? {...dest, visited: true}
                      : dest,
                ),
              }));

              Alert.alert(
                'Success',
                `You checked ${destinationName} successfully!`,
              );
            } catch (error) {
              console.error('Error updating destination:', error);
              Alert.alert('Error', 'Failed to update destination status.');
            }
          } else {
            Alert.alert('Failed', `You are not at the destination yet.`);
          }
        },
        error => {
          let errorMessage =
            'Unable to retrieve location. Please check your device settings.';

          switch (error.code) {
            case 1:
              errorMessage =
                'Location permission denied. Please allow access to your location.';
              break;
            case 2:
              errorMessage =
                'Location position unavailable. Please try again later.';
              break;
            case 3:
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
    if (
      tripDetails &&
      tripDetails.destinations.every((dest: Destination) => dest.visited)
    ) {
      Alert.alert('Finished', 'You have completed your trip checks.');
      navigation.goBack(); // Go back once
      navigation.navigate('MediaUpload', {tripId});
    } else {
      Alert.alert(
        'Incomplete',
        'Please check all destinations before finishing.',
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D9676" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Details</Text>
      {tripDetails && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {tripDetails.destinations.map(
            (destination: Destination, index: number) => (
              <View
                key={`${destination.destinationName}-${index}`}
                style={[
                  styles.card,
                  destination.visited && styles.checkedCard,
                ]}>
                <Text style={styles.destination}>
                  {destination.destinationName}
                  {destination.time ? ` (Time: ${destination.time})` : ''}
                </Text>
                {!destination.visited && (
                  <TouchableOpacity
                    style={styles.checkButton}
                    onPress={() => handleCheck(destination.destinationName)}>
                    <Text style={styles.checkButtonText}>Check</Text>
                  </TouchableOpacity>
                )}
              </View>
            ),
          )}
        </ScrollView>
      )}
      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishButtonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1B3232',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FAD8B0',
    marginBottom: 20,
    textAlign: 'left',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#415F5F',
    elevation: 2,
  },
  checkedCard: {
    backgroundColor: 'black',
  },
  destination: {
    fontSize: 18,
    color: '#FAD8B0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#3D9676',
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#3D9676',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  finishButtonText: {
    color: '#E7B171',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateTripDetails;
