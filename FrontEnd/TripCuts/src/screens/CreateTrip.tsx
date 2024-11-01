import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Yup from 'yup';
import {Formik, FormikErrors, FormikTouched} from 'formik';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParamList} from '../App';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {useAuth} from './context/AuthContext';
import axios from 'axios';

interface Destination {
  destinationName: string;
  visited: boolean;
  time: string | null;
}

interface FormValues {
  tripName: string;
  tripType: string;
  budget: number;
  destinations: Destination[];
}

const validationSchema = Yup.object().shape({
  tripName: Yup.string().required('Trip name is required'),
  tripType: Yup.string().required('Type of trip is required'),
  budget: Yup.number()
    .typeError('Budget must be a number')
    .required('Budget is required')
    .positive('Budget must be a positive number'),
  destinations: Yup.array()
    .of(
      Yup.object().shape({
        destinationName: Yup.string().required('Destination name is required'),
        visited: Yup.boolean(),
        time: Yup.string().nullable(),
      }),
    )
    .min(2, 'Add at least one source and destination'),
});

const CreateTrip = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const {getUserID} = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [source, setSource] = useState<string>('');
  const [time, setTime] = useState<string | null>(null);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            text,
          )}.json?access_token=pk.eyJ1Ijoia2xpbnNtYW5uIiwiYSI6ImNtMjN3bGhmejBhanEycXFzY3FmcHoyem4ifQ.wTTs41xza38fGRIEsrdp7g&autocomplete=true&limit=5`,
        );

        const formattedSuggestions = response.data.features.map(
          (feature: {place_name: string}) => {
            const parts = feature.place_name.split(',');
            const city = parts[0];
            const country = parts[parts.length - 1].trim();
            return `${city}, ${country}`;
          },
        );
        setSuggestions(formattedSuggestions);
      } catch (error) {
        console.error(error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    const user_id = await getUserID();
    console.log(values);

    try {
      const response = await fetch(
        'http://192.168.100.72:4000/api/v1/createTrip',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({...values, user_id}),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response:', data);
      navigation.navigate('Bag');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSource(suggestion);
    setQuery(suggestion);
    setSuggestions([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Create Trip</Text>

          <Formik
            initialValues={
              {
                tripName: '',
                tripType: '',
                budget: 0,
                destinations: [],
              } as FormValues
            }
            validationSchema={validationSchema}
            onSubmit={handleSubmit}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldTouched,
            }) => (
              <>
                <Text style={styles.label}>Trip Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex. Summer Vacation"
                  placeholderTextColor="#B0BEC5"
                  value={values.tripName}
                  onBlur={handleBlur('tripName')}
                  onChangeText={handleChange('tripName')}
                />
                {touched.tripName && errors.tripName && (
                  <Text style={styles.errorText}>{errors.tripName}</Text>
                )}

                <Text style={styles.label}>Type of Trip:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex. Adventure"
                  placeholderTextColor="#B0BEC5"
                  value={values.tripType}
                  onBlur={handleBlur('tripType')}
                  onChangeText={handleChange('tripType')}
                />
                {touched.tripType && errors.tripType && (
                  <Text style={styles.errorText}>{errors.tripType}</Text>
                )}

                <Text style={styles.label}>Budget:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex. 10000"
                  placeholderTextColor="#B0BEC5"
                  value={values.budget.toString()}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onBlur={handleBlur('budget')}
                  onChangeText={handleChange('budget')}
                />
                {touched.budget && errors.budget && (
                  <Text style={styles.errorText}>{errors.budget}</Text>
                )}

                <Text style={styles.label}>Destination:</Text>
                <View style={styles.destinationContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter destination"
                    placeholderTextColor="#B0BEC5"
                    value={source}
                    onChangeText={text => {
                      setSource(text);
                      handleSearch(text);
                    }}
                  />
                  {suggestions.length > 0 && (
                    <View style={styles.suggestionContainer}>
                      {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleSuggestionSelect(suggestion)}>
                          <Text style={styles.suggestionText}>
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    if (source.trim()) {
                      values.destinations.push({
                        destinationName: source,
                        visited: false,
                        time: time || null,
                      });
                      setSource('');
                      setTime(null);
                    }
                  }}>
                  <Text style={styles.addButtonText}>Add Destination</Text>
                </TouchableOpacity>

                {values.destinations.map((dest, index) => (
                  <View key={index} style={styles.card}>
                    <Text style={styles.cardText}>
                      {index === 0 ? 'Source' : `Destination ${index}`} :{' '}
                      {dest.destinationName}
                      {dest.time && ` (Time: ${dest.time})`}
                    </Text>
                    {touched.destinations &&
                      errors.destinations &&
                      Array.isArray(errors.destinations) &&
                      errors.destinations[index] && (
                        <Text style={styles.errorText}>
                          {
                            (
                              errors.destinations[
                                index
                              ] as FormikErrors<Destination>
                            ).destinationName
                          }
                        </Text>
                      )}
                  </View>
                ))}

                {touched.destinations && Array.isArray(errors.destinations) && (
                  <Text style={styles.errorText}>
                    {errors.destinations.join(', ')}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => {
                    handleSubmit();
                    if (values.destinations.length < 2) {
                      values.destinations.forEach((_, index) =>
                        setFieldTouched(
                          `destinations.${index}.destinationName`,
                        ),
                      );
                    }
                  }}>
                  <Text style={styles.createButtonText}>Create Trip</Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3232',
    padding: 20,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FAD8B0',
    marginBottom: 20,
    textAlign: 'left',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAD8B0',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    borderColor: '#FAD8B0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#415F5F',
    marginBottom: 10,
    height: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#3D9676',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  suggestionContainer: {
    borderColor: '#3D9676',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginTop: 5,
    width: '100%',
    position: 'absolute',
    zIndex: 1,
    elevation: 3,
  },
  suggestionText: {
    padding: 10,
    color: '#415F5F',
  },
  card: {
    backgroundColor: '#1B3232',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardText: {
    color: '#FAD8B0',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#3D9676',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  destinationContainer: {
    width: '100%',
    marginBottom: 10,
  },
});

export default CreateTrip;
