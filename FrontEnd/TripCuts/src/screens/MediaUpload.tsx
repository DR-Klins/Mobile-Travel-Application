import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import axios from 'axios';
import {RootStackParamList} from '../App';
import {useAuth} from './context/AuthContext';
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET} from '@env';

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

const questions = [
  'Define your Itinerary',
  'Transport Options',
  'Best time to visit',
  'Safety Tips',
  'Emergency and Useful Contacts',
  'Approximate walking Distance',
  'Language Tips',
  "What's your favorite place you've visited?",
  'Give Brief Summary',
];

const MediaUpload: React.FC<TripDetailScreenProps> = ({route}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {tripId} = route.params;
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const {getUserID} = useAuth();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    [key: number]: {uri: string; type: string}[];
  }>({});
  const [vlogMedia, setVlogMedia] = useState<{
    uri: string;
    type: string;
  } | null>(null);
  const [cutsMedia, setCutsMedia] = useState<{
    uri: string;
    type: string;
  } | null>(null);
  const [popUpIndex, setPopUpIndex] = useState(0);
  const [responses, setResponses] = useState(Array(questions.length).fill(''));
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      setLoading(true);
      const user_id = await getUserID();

      try {
        const response = await axios.post(
          'http://192.168.100.72:4000/api/v1/getTrips',
          {
            user_id: user_id,
          },
        );
        const trip = response.data.trips.find(
          (t: TripDetails) => t._id === tripId,
        );
        if (trip) {
          setTripDetails(trip);
        } else {
          console.error('Trip not found');
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, getUserID]);

  const handleExpand = (index: number) => {
    setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const handleFinish = () => {
    setPopUpIndex(0); // Reset to the first question
    setModalVisible(true); // Show the first pop-up
  };

  const selectMedia = (index: number, type: 'mixed' | 'video' = 'mixed') => {
    launchImageLibrary(
      {
        mediaType: type, // Allows mixed (image/video) or only video
        selectionLimit: 0, // Allow multiple selections (set to 0 for unlimited)
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.error('ImagePicker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const selectedMediaItems = response.assets
            .map(asset => ({
              uri: asset.uri || '',
              type: asset.type || 'video/mp4', // Default to video/mp4
            }))
            .filter(media => media.uri);

          setSelectedMedia(prev => ({
            ...prev,
            [index]: [...(prev[index] || []), ...selectedMediaItems], // Append new media to the existing ones
          }));
          console.log('Selected Media for Card:', selectedMediaItems);
        }
      },
    );
  };

  const selectVlogOrCutsMedia = (
    setMediaState: React.Dispatch<
      React.SetStateAction<{uri: string; type: string} | null>
    >,
  ) => {
    launchImageLibrary(
      {
        mediaType: 'video', // Only allow video for Vlog and Cuts
        selectionLimit: 1, // Only allow one video to be selected
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled video picker');
        } else if (response.errorMessage) {
          console.error('VideoPicker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const selectedVideo = {
            uri: response.assets[0]?.uri || '',
            type: 'video/mp4',
          };
          setMediaState(selectedVideo);
          console.log('Selected Video:', selectedVideo);
        }
      },
    );
  };

  const uploadToCloudinary = async (index: number, destinationName: string) => {
    if (!selectedMedia[index] || selectedMedia[index].length === 0) {
      Alert.alert('Error', 'Please select media to upload');
      return;
    }

    // Prepare an array to store the uploaded media details
    const uploadedMediaArray = [];

    try {
      for (const media of selectedMedia[index]) {
        const formData = new FormData();
        formData.append('file', {
          uri: media.uri,
          type: media.type,
          name: `upload.${media.type === 'video/mp4' ? 'mp4' : 'jpg'}`,
        });
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'Destinations');

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        // Collect the uploaded media details
        uploadedMediaArray.push({
          public_id: response.data.public_id,
          url: response.data.url,
          resource_type: response.data.resource_type,
          format: response.data.format,
        });
      }

      // Send the batch of media to be saved in the database
      await saveMediaToDatabase(tripId, destinationName, uploadedMediaArray);
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      Alert.alert('Error', 'Failed to upload media');
    }
  };

  const saveMediaToDatabase = async (
    tripId: string,
    destinationName: string,
    mediaDataArray: {
      public_id: string;
      url: string;
      resource_type: string;
      format: string;
    }[],
  ) => {
    try {
      // Send all media as an array
      await axios.post(`http://192.168.100.72:4000/api/v1/saveMedia`, {
        tripId,
        destinationName,
        media: mediaDataArray, // Pass the array of media
      });

      Alert.alert('Success', 'Media successfully saved to the database');
    } catch (error) {
      console.error('Error saving media to database:', error);
      Alert.alert('Error', 'Failed to save media to database');
    }
  };
  const uploadVlogOrCutsToCloudinary = async (
    media: {uri: string; type: string} | null,
    mediaType: 'Vlog' | 'Cuts',
  ) => {
    if (!media || !media.uri) {
      Alert.alert(
        'Error',
        `Please select a ${mediaType.toLowerCase()} video to upload`,
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: media.uri,
        type: media.type,
        name: `${mediaType.toLowerCase()}.mp4`, // Naming convention for media
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', mediaType); // Upload to the corresponding folder: "Vlog" or "Cuts"

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const url = response.data.url;
      const public_id = response.data.public_id;
      const format = response.data.format;
      const asset_id = response.data.asset_id;
      const resource_type = response.data.resource_type;
      const tripName = tripDetails?.tripName || 'Default Trip Name';

      if (mediaType === 'Vlog') {
        await updateVlogInDB(
          url,
          public_id,
          format,
          asset_id,
          resource_type,
          tripId,
        ); // Call API to update Vlog in DB
      } else if (mediaType === 'Cuts') {
        await updateCutsInDB(
          url,
          public_id,
          format,
          asset_id,
          resource_type,
          tripName,
          tripId,
        ); // Call API to update Cuts in DB
      }

      Alert.alert('Success', `${mediaType} video uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${mediaType} video to Cloudinary:`, error);
      Alert.alert('Error', `Failed to upload ${mediaType} video`);
    }
  };

  // Function to update Vlog in DB using a separate API
  const updateVlogInDB = async (
    url: string,
    public_id: string,
    format: string,
    asset_id: string,
    resource_type: string,
    tripId: string,
  ) => {
    try {
      await axios.post(
        'http://192.168.100.72:4000/api/v1/createVlog', // API for uploading Vlog
        {
          public_id,
          url,
          format,
          asset_id,
          resource_type,
          tripId,
        },
      );
      console.log('Vlog uploaded to DB:');
    } catch (error) {
      console.error('Error updating Vlog in DB:', error);
    }
  };

  // Function to update Cuts in DB using a separate API
  const updateCutsInDB = async (
    url: string,
    public_id: string,
    format: string,
    asset_id: string,
    resource_type: string,
    tripName: string,
    tripId: string,
  ) => {
    try {
      const response = await axios.post(
        'http://192.168.100.72:4000/api/v1/createCuts', // API for uploading Cuts
        {
          url,
          public_id,
          format,
          asset_id,
          resource_type,
          tripName,
          tripId,
        },
      );
      console.log('Cuts uploaded to DB:', response.data);
    } catch (error) {
      console.error('Error updating Cuts in DB:', error);
    }
  };

  const submitResponses = async () => {
    try {
      // Log the current responses state
      console.log('Current responses:', responses);

      // Construct the payload according to your Mongoose schema
      const payload = {
        tripId, // Pass the tripId
        q1: responses[0] || '',
        q2: responses[1] || '',
        q3: responses[2] || '',
        q4: responses[3] || '',
        q5: responses[4] || '',
        q6: responses[5] || '',
        q7: responses[6] || '',
        q8: responses[7] || '',
        q9: responses[8] || '',
      };

      // Log the final payload to be sent
      console.log('Payload being sent:', payload);

      // Make the API request to submit the itinerary
      const response = await axios.post(
        'http://192.168.100.72:4000/api/v1/createItinerary',
        payload,
      );

      Alert.alert('Success', 'Itinerary successfully created');
    } catch (error) {
      console.error('Error submitting responses:', error);
      Alert.alert('Error', 'Failed to submit the itinerary');
    }
  };

  const handleNextQuestion = () => {
    if (popUpIndex < questions.length - 1) {
      setPopUpIndex(prevIndex => prevIndex + 1);
    } else {
      submitResponses();
      setModalVisible(false); // Close modal after submission
      navigation.navigate('TripLandingPage', {tripId});
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FAD8B0" />
      </View>
    );
  }

  if (!tripDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Trip Details Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Media</Text>
      <ScrollView>
        {tripDetails.destinations.map((destination, index) => (
          <View
            key={`${destination.destinationName}-${index}`}
            style={styles.card}>
            <TouchableOpacity
              onPress={() => handleExpand(index)}
              style={styles.cardHeader}>
              <Text style={styles.destination}>
                {destination.destinationName}
              </Text>
            </TouchableOpacity>
            {expandedIndex === index && (
              <View style={styles.expandedContent}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mediaScroll}>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={() => selectMedia(index)}>
                    <Text style={styles.plusSign}>+</Text>
                  </TouchableOpacity>
                  {selectedMedia[index]?.map((media, mediaIndex) => (
                    <Image
                      key={mediaIndex}
                      source={{uri: media.uri}}
                      style={styles.mediaPreview}
                    />
                  ))}
                </ScrollView>
                <View style={styles.uploadButton}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      uploadToCloudinary(index, destination.destinationName)
                    }>
                    <Text style={styles.buttonText}>Upload Media</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Vlog Card */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => handleExpand(999)}
            style={styles.cardHeader}>
            <Text style={styles.destination}>Vlog</Text>
          </TouchableOpacity>
          {expandedIndex === 999 && (
            <View style={styles.expandedContent}>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => selectVlogOrCutsMedia(setVlogMedia)}>
                <Text style={styles.plusSign}>+</Text>
              </TouchableOpacity>
              {vlogMedia && (
                <Image
                  source={{uri: vlogMedia.uri}}
                  style={styles.mediaPreview}
                />
              )}
              <View style={styles.uploadButton}>
                <TouchableOpacity
                  style={styles.button} // Add styles for the button here
                  onPress={() =>
                    uploadVlogOrCutsToCloudinary(vlogMedia, 'Vlog')
                  }>
                  <Text style={styles.buttonText}>Upload Vlog</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Cuts Card */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => handleExpand(1000)}
            style={styles.cardHeader}>
            <Text style={styles.destination}>Cuts</Text>
          </TouchableOpacity>
          {expandedIndex === 1000 && (
            <View style={styles.expandedContent}>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => selectVlogOrCutsMedia(setCutsMedia)}>
                <Text style={styles.plusSign}>+</Text>
              </TouchableOpacity>
              {cutsMedia && (
                <Image
                  source={{uri: cutsMedia.uri}}
                  style={styles.mediaPreview}
                />
              )}
              <View style={styles.uploadButton}>
                <TouchableOpacity
                  style={styles.button} // Add custom styles here if needed
                  onPress={() =>
                    uploadVlogOrCutsToCloudinary(cutsMedia, 'Cuts')
                  }>
                  <Text style={styles.buttonText}>Upload Cuts</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View>
          <TouchableOpacity style={styles.button} onPress={handleFinish}>
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal for itinerary questions */}
      <Modal visible={modalVisible} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalQuestion}>{questions[popUpIndex]}</Text>
            <TextInput
              style={
                popUpIndex === 0 || popUpIndex === questions.length - 1
                  ? styles.largeTextInput
                  : styles.smallTextInput
              }
              value={responses[popUpIndex]}
              onChangeText={text => {
                const updatedResponses = [...responses];
                updatedResponses[popUpIndex] = text;
                setResponses(updatedResponses);
              }}
              placeholder="Your answer"
            />
            <Button
              title={popUpIndex < questions.length - 1 ? 'Next' : 'Finsh'}
              onPress={handleNextQuestion}
              color="#FAD8B0"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1B3232',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E7B171',
    paddingBottom: 50,
    paddingTop: 5,
  },
  card: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: 'black',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#FAD8B0',
  },
  destination: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FAD8B0',
  },
  expandedContent: {
    paddingTop: 10,
  },
  mediaScroll: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  uploadBox: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    marginRight: 10,
  },
  uploadButton: {
    // Add any styles for the surrounding view if necessary
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#FAD8B0', // Button background color
    padding: 10,
    alignItems: 'center', // Center text horizontally
  },
  buttonText: {
    color: '#1B3232', // Text color
    fontSize: 16, // Text size
    fontWeight: 'bold',
  },
  plusSign: {
    fontSize: 30,
    color: '#888',
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#FAD8B0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#415F5F',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 3, // Adjust thickness here
    borderColor: '#E7B171', // Black color
  },
  modalQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  largeTextInput: {
    width: 280,
    height: 250,
    padding: 10,
    borderColor: '#FAD8B0',
    borderWidth: 1,
    marginVertical: 10,
    color: 'white',
  },
  smallTextInput: {
    width: 280,
    height: 50,
    padding: 10,
    borderColor: '#FAD8B0',
    borderWidth: 1,
    marginVertical: 10,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B3232', // Same color as ActivityIndicator
  },
  loadingText: {
    color: '#FAD8B0',
    marginTop: 10,
  },
});

export default MediaUpload;
