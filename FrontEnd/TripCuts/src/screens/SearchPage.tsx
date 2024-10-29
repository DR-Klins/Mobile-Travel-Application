import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  Modal, // Import Modal
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../App';
import debounce from 'lodash.debounce';
import Video from 'react-native-video'; // Import Video component
import Icon from 'react-native-vector-icons/MaterialIcons'; // Adjust the import based on your icon library

const {height} = Dimensions.get('window');

// Define the Cut interface
interface Cut {
  _id: string;
  public_id: string;
  url: string;
  format: string;
  asset_id: string;
  resource_type: string;
  tripName: string;
  tripId: string;
  created_at: string;
  __v: number;
}

// Define the User interface
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  __v: number;
}

const SearchPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<(Cut | User)[]>([]);
  const [noResultsMessage, setNoResultsMessage] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<Cut | null>(null); // State for selected video
  const slideAnim = useRef(new Animated.Value(height)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const focusInput = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(focusInput);
  }, [slideAnim]);

  const fetchSearchResults = async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setNoResultsMessage('');
      return;
    }

    try {
      const response = await fetch(
        'http://192.168.100.72:4000/api/v1/searchUsersAndCuts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({query}),
        },
      );

      const data = await response.json();
      if (data.success) {
        const filteredCuts = data.cuts.filter((cut: Cut) =>
          cut.tripName.toLowerCase().includes(query.toLowerCase()),
        );
        const filteredUsers = data.users.filter((user: User) =>
          user.name.toLowerCase().includes(query.toLowerCase()),
        );

        const combinedResults = [...filteredCuts, ...filteredUsers];
        setResults(combinedResults);
        setNoResultsMessage(
          combinedResults.length === 0 ? 'No matches found.' : '',
        );
      } else {
        setResults([]);
        setNoResultsMessage('No matches found.');
      }
    } catch (error) {
      console.error(error);
      setResults([]);
      setNoResultsMessage('No matches found.');
    }
  };

  const debouncedFetchResults = useCallback(
    debounce(fetchSearchResults, 300),
    [],
  );

  const handleInputChange = (text: string) => {
    setSearchQuery(text);
    debouncedFetchResults(text);
  };

  const openVideo = (cut: Cut) => {
    setSelectedVideo(cut); // Set the selected video
  };

  const closeVideo = () => {
    setSelectedVideo(null); // Clear the selected video
  };

  const handleItineraryPress = () => {
    if (selectedVideo) {
      navigation.navigate('TripLandingPage', {tripId: selectedVideo.tripId});
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.searchContainer,
          {transform: [{translateY: slideAnim}]},
        ]}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="grey"
          value={searchQuery}
          onChangeText={handleInputChange}
        />
      </Animated.View>
      <FlatList
        data={results}
        keyExtractor={item => item._id}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => {
              if ('url' in item) {
                openVideo(item); // Open the video if it's a cut
              } else {
                navigation.navigate('TravelerProfile', {user_id: item._id}); // Navigate to TravelerProfile with user ID
              }
            }}>
            <View style={styles.resultItem}>
              <Text style={styles.resultText}>
                {'tripName' in item ? item.tripName : item.name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        style={styles.resultsContainer}
        contentContainerStyle={results.length === 0 ? styles.emptyResults : {}}
      />

      {noResultsMessage.length > 0 && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>{noResultsMessage}</Text>
        </View>
      )}

      {/* Modal for Video Preview */}
      {selectedVideo && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeVideo}>
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Video
              source={{uri: selectedVideo.url}}
              style={styles.modalVideo}
              resizeMode="cover"
              repeat={true}
            />
            <TouchableOpacity
              style={styles.itineraryButton}
              onPress={handleItineraryPress}>
              <Text style={styles.itineraryButtonText}>Itinerary</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  searchContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    color: 'white',
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 50,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultText: {
    color: 'white',
    fontSize: 16,
  },
  emptyResults: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  noResultsText: {
    color: 'white',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 30,
    right: 30,
    zIndex: 10,
  },
  modalVideo: {
    width: '100%',
    height: '100%', // Adjust height as needed
  },
  itineraryButton: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  itineraryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default SearchPage;
