import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Yup from 'yup';
import {Formik} from 'formik';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParamList} from '../App';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {useAuth} from './context/AuthContext';
import axios from 'axios';

// Define form values type
interface FormValues {
  tripName: string; // New field for trip name
  tripType: string;
  budget: number;
  destinations: string[];
}

// Validation schema
const validationSchema = Yup.object().shape({
  tripName: Yup.string().required('Trip name is required'), // New validation
  tripType: Yup.string().required('Type of trip is required'),
  budget: Yup.number()
    .typeError('Budget must be a number')
    .required('Budget is required')
    .positive('Budget must be a positive number'),
  destinations: Yup.array()
    .of(Yup.string().min(1, 'Each destination must not be empty')) // Ensure non-empty strings
    .min(2, 'Add at least one source and destination'), // Minimum length for the array
});

const CreateTrip = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const {getUserID} = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [source, setSource] = useState<string>(''); // For adding source/destination
  const [isSourceAdded, setIsSourceAdded] = useState<boolean>(false); // To track if source is added

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            text,
          )}.json?access_token=pk.eyJ1Ijoia2xpbnNtYW5uIiwiYSI6ImNtMjN3bGhmejBhanEycXFzY3FmcHoyem4ifQ.wTTs41xza38fGRIEsrdp7g&autocomplete=true&limit=5`,
        );

        // Explicitly define the type for the features array
        const formattedSuggestions = response.data.features.map(
          (feature: {place_name: string}) => {
            const parts = feature.place_name.split(',');
            const city = parts[0]; // Get the city name
            const country = parts[parts.length - 1].trim(); // Get the country name
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
    console.log(typeof values.budget);
    console.log(values); // Log the final values

    try {
      const response = await fetch(
        'http://192.168.100.38:4000/api/v1/createTrip',
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
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSource(suggestion);
    setQuery(suggestion);
    setSuggestions([]); // Clear suggestions after selecting
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Trip</Text>

        <Formik
          initialValues={
            {
              tripName: '', // Initial value for trip name
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
          }) => (
            <>
              {/* Trip Name Input */}
              <Text style={styles.label}>Trip Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex. Summer Vacation"
                value={values.tripName}
                onBlur={handleBlur('tripName')}
                onChangeText={handleChange('tripName')}
              />
              {touched.tripName && errors.tripName && (
                <Text style={styles.errorText}>{errors.tripName}</Text>
              )}

              {/* Trip Type Input */}
              <Text style={styles.label}>Type of Trip:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex. Adventure"
                value={values.tripType}
                onBlur={handleBlur('tripType')}
                onChangeText={handleChange('tripType')}
              />
              {touched.tripType && errors.tripType && (
                <Text style={styles.errorText}>{errors.tripType}</Text>
              )}

              {/* Budget Input */}
              <Text style={styles.label}>Budget:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex. 10000"
                value={values.budget.toString()}
                keyboardType="numeric"
                returnKeyType="done"
                onBlur={handleBlur('budget')}
                onChangeText={handleChange('budget')}
              />
              {touched.budget && errors.budget && (
                <Text style={styles.errorText}>{errors.budget}</Text>
              )}

              {/* Source/Destination Input */}
              <Text style={styles.label}>
                {isSourceAdded ? 'Destination' : 'Source'}:
              </Text>
              <View style={styles.destinationContainer}>
                <TextInput
                  style={styles.input} // Restore original size of the text box
                  placeholder={`Enter ${
                    isSourceAdded ? 'destination' : 'source'
                  }`}
                  value={source}
                  onChangeText={text => {
                    setSource(text);
                    handleSearch(text); // Fetch suggestions as the user types
                  }}
                />
              </View>
              <View style={{width: '100%'}}>
                <Button
                  title="Add"
                  onPress={() => {
                    if (source.trim()) {
                      values.destinations.push(source); // Push to Formik's destinations
                      setSource(''); // Clear the input
                      setIsSourceAdded(true); // Mark that source is added
                    }
                  }}
                />
              </View>

              {/* Suggestion Box */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionContainer}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSuggestionSelect(suggestion)}>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Display Added Destinations */}
              {values.destinations.map((dest, index) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.cardText}>
                    {index === 0 ? 'Source' : `Destination ${index}`} : {dest}
                  </Text>
                </View>
              ))}

              {/* Show error for destinations if touched */}
              {touched.destinations && errors.destinations && (
                <Text style={styles.errorText}>{errors.destinations}</Text>
              )}

              {/* Submit Button */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => {
                    handleSubmit();
                    if (values.destinations.length < 2) {
                      // Ensure Formik touches the destinations field to show error
                      touched.destinations = true; // Mark destinations as touched
                    }
                  }}>
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#ff0d10',
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  suggestionContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    zIndex: 1000,
    marginTop: 5,
    width: '100%', // Ensure it takes full width of the input
  },
  suggestionText: {
    padding: 10,
    fontSize: 16,
  },
  suggestionTextHovered: {
    backgroundColor: '#f0f0f0',
  },
  card: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  cardText: {
    fontSize: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CreateTrip;
